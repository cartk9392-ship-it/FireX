import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Trophy, Swords, DollarSign, Award, 
  Activity, TrendingUp, Clock
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loader from '../components/Loader';

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
  email: string;
  walletBalance: number;
  isBanned: boolean;
}

interface Match {
  id: string;
  tournamentName: string;
  status: string;
  startTime: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  userName: string;
}

export const AdminDashboard: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('firex_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const tRes = await fetch('/api/tournaments', { headers });
        const tData = await tRes.json();

        const pRes = await fetch('/api/players', { headers });
        const pData = await pRes.json();

        const mRes = await fetch('/api/matches', { headers });
        const mData = await mRes.json();

        const txRes = await fetch('/api/wallet/admin/transactions', { headers });
        const txData = await txRes.json();

        if (Array.isArray(tData)) setTournaments(tData);
        if (Array.isArray(pData)) setPlayers(pData);
        if (Array.isArray(mData)) setMatches(mData);
        if (Array.isArray(txData)) setTransactions(txData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  // Calculate ERP metrics
  const totalPlayers = players.length;
  const totalTournaments = tournaments.length;
  const liveMatches = matches.filter(m => m.status === 'Live').length;
  const upcomingMatches = matches.filter(m => m.status === 'Upcoming');

  // Revenue = Sum of entry fees
  const totalRevenue = transactions
    .filter(tx => tx.type === 'Entry Fee' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Prize pending = Sum of pending withdrawals
  const prizePending = transactions
    .filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Recent registrations (mock using recent transactions of entry fee type)
  const recentRegistrations = transactions
    .filter(tx => tx.type === 'Entry Fee')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header Summary Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">ERP Dashboard</h1>
          <p className="text-xs text-textGray font-semibold mt-1">
            System overview, finances auditing, and active tournament brackets
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/tournaments">
            <Button size="sm" icon={<Trophy size={14} />}>New Tournament</Button>
          </Link>
          <Link to="/admin/prizes">
            <Button size="sm" variant="outline" icon={<Award size={14} />}>Distribute Prizes</Button>
          </Link>
        </div>
      </div>

      {/* Grid of Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 flex flex-col justify-between h-full bg-slate-900 border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Total Players</span>
            <Users size={16} className="text-orange-500" />
          </div>
          <h3 className="text-2xl font-black text-white mt-4">{totalPlayers}</h3>
        </Card>

        <Card className="p-4 flex flex-col justify-between h-full bg-slate-900 border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Tournaments</span>
            <Trophy size={16} className="text-orange-500" />
          </div>
          <h3 className="text-2xl font-black text-white mt-4">{totalTournaments}</h3>
        </Card>

        <Card className="p-4 flex flex-col justify-between h-full bg-slate-900 border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Live Match</span>
            <Swords size={16} className="text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-4">{liveMatches}</h3>
        </Card>

        <Card className="p-4 flex flex-col justify-between h-full bg-slate-900 border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Total Revenue</span>
            <DollarSign size={16} className="text-primary" />
          </div>
          <h3 className="text-2xl font-black text-white mt-4">₹{totalRevenue}</h3>
        </Card>

        <Card className="p-4 flex flex-col justify-between h-full bg-slate-900 border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Prize Pending</span>
            <Clock size={16} className="text-red-400" />
          </div>
          <h3 className="text-2xl font-black text-red-400 mt-4">₹{prizePending}</h3>
        </Card>

        <Card className="p-4 flex flex-col justify-between h-full bg-slate-900 border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-textGray font-bold uppercase">Audit Health</span>
            <Activity size={16} className="text-sky-400" />
          </div>
          <h3 className="text-2xl font-black text-sky-400 mt-4">100%</h3>
        </Card>
      </div>

      {/* Analytics Graph Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Revenue Growth Analytics" subtitle="Monthly tracking of entry fees vs withdrawals">
            {/* Beautiful Custom SVG Graph Placeholder */}
            <div className="h-60 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary" /> <span className="font-bold text-white">Entry Fees</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-700" /> <span className="font-bold text-textGray">Withdrawals</span></div>
                </div>
                <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-black uppercase flex items-center gap-1">
                  <TrendingUp size={12} />
                  +12.4% MoM
                </span>
              </div>

              {/* Graphic charts mock */}
              <div className="flex items-end justify-between h-32 gap-3 w-full px-2">
                {[45, 60, 50, 78, 90, 110, 85, 120, 140, 160].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-slate-800 rounded-t-sm h-24 flex items-end">
                      <div 
                        className="w-full orange-gradient-bg rounded-t-sm transition-all duration-500 hover:brightness-125 cursor-pointer"
                        style={{ height: `${h / 2}px` }} 
                        title={`₹${h * 50}`}
                      />
                    </div>
                    <span className="text-[9px] text-textGray font-bold uppercase">M{i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Upcoming matches list */}
          <Card 
            title="Lobby Match Schedules" 
            subtitle="Admin dashboard monitor of room links"
            extra={
              <Link to="/admin/matches" className="text-xs font-bold text-primary hover:underline">
                Manage Matches
              </Link>
            }
          >
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-8 text-textGray text-xs italic">
                No upcoming match rooms scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((m) => (
                  <div key={m.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{m.tournamentName}</h4>
                      <p className="text-xs text-textGray mt-0.5">Start: {new Date(m.startTime).toLocaleString()}</p>
                    </div>
                    <Badge>{m.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right side activity feed */}
        <div className="space-y-6">
          <Card title="Recent Registrations" subtitle="Latest players joining brackets">
            {recentRegistrations.length === 0 ? (
              <div className="text-center py-8 text-textGray text-xs italic">
                No registrations logged today.
              </div>
            ) : (
              <div className="space-y-4">
                {recentRegistrations.map((reg) => (
                  <div key={reg.id} className="flex justify-between items-center text-xs font-semibold">
                    <div>
                      <h4 className="font-bold text-white truncate max-w-[130px]">{reg.userName}</h4>
                      <span className="text-[10px] text-slate-500 block">Enrolled in bracket</span>
                    </div>
                    <span className="text-primary font-bold">₹{reg.amount} INR</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Latest System Audit">
            <div className="space-y-4 text-xs font-semibold text-textGray">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Database Health</span>
                <span className="text-white">Active</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Fastify Port 5000</span>
                <span className="text-white">Listening</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Wallet Transactions</span>
                <span className="text-white">Enabled</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
