import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: string;
  amount: number;
  status: string;
  date: string;
}

interface Tournament {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  joinedCount: number;
  status: string;
}

interface Player {
  id: string;
  name: string;
  isBanned: boolean;
}

export const AdminReports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('firex_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const txRes = await fetch('/api/wallet/admin/transactions', { headers });
        const txData = await txRes.json();

        const tRes = await fetch('/api/tournaments', { headers });
        const tData = await tRes.json();

        const pRes = await fetch('/api/players', { headers });
        const pData = await pRes.json();

        if (Array.isArray(txData)) setTransactions(txData);
        if (Array.isArray(tData)) setTournaments(tData);
        if (Array.isArray(pData)) setPlayers(pData);
      } catch (e) {
        console.error("Failed to load reports audits", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  // Audits & Balances
  const approvedDeposits = transactions
    .filter(tx => tx.type === 'Deposit' && tx.status === 'Approved')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const approvedWithdrawals = transactions
    .filter(tx => tx.type === 'Withdrawal' && tx.status === 'Approved')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const entryFeesCollected = transactions
    .filter(tx => tx.type === 'Entry Fee' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const prizesAwarded = transactions
    .filter(tx => tx.type === 'Prize' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const cashEscrowHolding = approvedDeposits - approvedWithdrawals - entryFeesCollected + prizesAwarded;

  // Platform performance
  const platformRevenue = entryFeesCollected - prizesAwarded;

  // Tournament stats
  const upcomingCount = tournaments.filter(t => t.status === 'Upcoming').length;
  const liveCount = tournaments.filter(t => t.status === 'Live').length;
  const completedCount = tournaments.filter(t => t.status === 'Completed').length;

  // Players
  const totalPlayers = players.length;
  const bannedPlayers = players.filter(p => p.isBanned).length;
  const activePlayers = totalPlayers - bannedPlayers;

  // Recent entries
  const recentEntries = transactions
    .filter(tx => tx.type === 'Entry Fee')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">System Audits & Reports</h1>
        <p className="text-xs text-textGray font-semibold mt-1">
          Financial statements audit ledger, player metrics distribution lists, and tournament activity reports
        </p>
      </div>

      {/* Financial statement summary row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 p-4.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Deposits Audited</span>
            <ArrowDownLeft size={16} className="text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-3">₹{approvedDeposits} INR</h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Cash deposited from players</p>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-4.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Withdrawals Finalized</span>
            <ArrowUpRight size={16} className="text-rose-400" />
          </div>
          <h3 className="text-2xl font-black text-rose-400 mt-3">₹{approvedWithdrawals}</h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Cash cashed out from wallets</p>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-4.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Net Platform Profit</span>
            <TrendingUp size={16} className="text-primary" />
          </div>
          <h3 className="text-2xl font-black text-white mt-3">
            <span className={platformRevenue >= 0 ? 'text-primary' : 'text-rose-500'}>
              ₹{platformRevenue}
            </span>
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Entry fees minus prize distributed</p>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-4.5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Escrow Cash Holdings</span>
            <DollarSign size={16} className="text-sky-400" />
          </div>
          <h3 className="text-2xl font-black text-sky-400 mt-3">₹{cashEscrowHolding}</h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Net remaining user balances</p>
        </Card>
      </div>

      {/* Analytics widgets grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ledger Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Revenue Growth Analytics" subtitle="Monthly tracking of entry fees vs withdrawals">
            {/* Visual representation of financials */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-textGray">Total Entry Fee Revenues Collected</span>
                  <span className="text-white">₹{entryFeesCollected} INR</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                  <div className="bg-primary h-full rounded" style={{ width: entryFeesCollected + prizesAwarded > 0 ? `${(entryFeesCollected / (entryFeesCollected + prizesAwarded)) * 100}%` : '50%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-textGray">Total Cash Prizes Disbursed</span>
                  <span className="text-emerald-400">₹{prizesAwarded} INR</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded" style={{ width: entryFeesCollected + prizesAwarded > 0 ? `${(prizesAwarded / (entryFeesCollected + prizesAwarded)) * 100}%` : '50%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Activity Feed Ledger: Subscriptions">
            {recentEntries.length === 0 ? (
              <p className="py-8 text-center text-xs italic text-textGray">No registration entries logged.</p>
            ) : (
              <div className="divide-y divide-slate-850">
                {recentEntries.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs font-semibold">
                    <div>
                      <h4 className="font-bold text-white">{tx.userName}</h4>
                      <span className="text-[10px] text-slate-500">Registered bracket slot</span>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-bold">₹{tx.amount} INR</span>
                      <span className="block text-[9px] text-slate-500">{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Breakdown side listings */}
        <div className="space-y-6">
          <Card title="Operational Performance">
            <div className="space-y-4 text-xs font-semibold text-textGray">
              <div className="flex justify-between pb-3.5 border-b border-slate-800">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-yellow-400 rounded-full" /> Upcoming brackets</span>
                <span className="text-white font-bold">{upcomingCount}</span>
              </div>
              <div className="flex justify-between pb-3.5 border-b border-slate-800">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-400 rounded-full" /> Live brackets</span>
                <span className="text-white font-bold">{liveCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-slate-500 rounded-full" /> Completed brackets</span>
                <span className="text-white font-bold">{completedCount}</span>
              </div>
            </div>
          </Card>

          <Card title="Player Demographics">
            <div className="space-y-4 text-xs font-semibold text-textGray">
              <div className="flex justify-between pb-3.5 border-b border-slate-800">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-400 rounded-full" /> Active Players</span>
                <span className="text-white font-bold">{activePlayers}</span>
              </div>
              <div className="flex justify-between pb-3.5 border-b border-slate-800">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-red-400 rounded-full" /> Suspended Accounts</span>
                <span className="text-white font-bold">{bannedPlayers}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full" /> Aggregated Accounts</span>
                <span className="text-white font-bold">{totalPlayers}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
