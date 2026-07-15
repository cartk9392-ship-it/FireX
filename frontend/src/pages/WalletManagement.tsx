import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Award, Coins, Search, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Alert from '../components/Alert';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'Deposit' | 'Withdrawal' | 'Prize' | 'Entry Fee' | 'Bonus';
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  date: string;
  utrNumber?: string;
  playerUpiId?: string;
  remarks?: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  email: string;
}

export const WalletManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Completed'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Deposit' | 'Withdrawal' | 'Prize' | 'Entry Fee' | 'Bonus'>('All');
  const [search, setSearch] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Players list for target selector
  const [players, setPlayers] = useState<PlayerInfo[]>([]);

  // Promo Bonus Form states
  const [bonusTarget, setBonusTarget] = useState('all');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusMessage, setBonusMessage] = useState('');
  const [bonusSubmitting, setBonusSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch('/api/wallet/admin/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }

      // Fetch players list
      const playersRes = await fetch('/api/players', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const playersData = await playersRes.json();
      if (Array.isArray(playersData)) {
        setPlayers(playersData.map(p => ({ id: p.id, name: p.name, email: p.email })));
      }
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Failed to retrieve transactions ledger.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleProcessWithdrawal = async (txId: string, action: 'approve' | 'reject') => {
    setSubmittingId(txId);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/wallet/admin/withdrawals/${txId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: `Withdrawal request #${txId} was successfully ${action === 'approve' ? 'Approved' : 'Rejected'}.`
        });
        // Update local transaction status
        setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status: action === 'approve' ? 'Approved' : 'Rejected' } : tx));
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to process withdrawal.' });
      }
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Network connection error.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleProcessDeposit = async (txId: string, action: 'approve' | 'reject') => {
    setSubmittingId(txId);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/wallet/admin/deposits/${txId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: `Deposit request #${txId} was ${action === 'approve' ? '✅ Approved — wallet credited' : '❌ Rejected'}.`
        });
        setTransactions(prev => prev.map(tx =>
          tx.id === txId ? { ...tx, status: action === 'approve' ? 'Approved' : 'Rejected' } : tx
        ));
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to process deposit.' });
      }
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Network connection error.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSendBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    const amt = Number(bonusAmount);
    if (!amt || amt <= 0) {
      setAlertMsg({ type: 'error', text: 'Please enter a valid bonus amount.' });
      return;
    }

    if (!bonusMessage.trim()) {
      setAlertMsg({ type: 'error', text: 'Please enter a custom festival or promotion message.' });
      return;
    }

    setBonusSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch('/api/wallet/admin/bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target: bonusTarget,
          amount: amt,
          message: bonusMessage.trim()
        })
      });
      const data = await res.json();

      if (res.ok) {
        setAlertMsg({ type: 'success', text: data.message || 'Bonus distributed successfully!' });
        setBonusAmount('');
        setBonusMessage('');
        fetchTransactions(); // reload table
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to distribute bonus.' });
      }
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: 'error', text: 'Network error distributing bonus.' });
    } finally {
      setBonusSubmitting(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
    const matchesType = typeFilter === 'All' || tx.type === typeFilter;
    const matchesSearch = search === '' || 
      tx.userName.toLowerCase().includes(search.toLowerCase()) || 
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      tx.userId.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  // Escrow pending withdrawals list
  const pendingWithdrawals = transactions.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending');
  // Pending deposit requests
  const pendingDeposits = transactions.filter(tx => tx.type === 'Deposit' && tx.status === 'Pending');

  // Stats summaries
  const totalVolume = transactions
    .filter(tx => tx.status === 'Completed' || tx.status === 'Approved')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDeposited = transactions
    .filter(tx => tx.type === 'Deposit' && tx.status === 'Approved')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalWithdrawn = transactions
    .filter(tx => tx.type === 'Withdrawal' && tx.status === 'Approved')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Pagination slicing
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      header: 'Tx ID',
      accessor: (row: Transaction) => <span className="font-mono text-xs text-textGray">#{row.id}</span>
    },
    {
      header: 'Date',
      accessor: (row: Transaction) => <span className="text-slate-400 text-xs font-semibold">{new Date(row.date).toLocaleString()}</span>
    },
    {
      header: 'User Name',
      accessor: (row: Transaction) => (
        <div>
          <span className="font-bold text-white block">{row.userName}</span>
          <span className="text-[10px] font-mono text-slate-500">ID: {row.userId}</span>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: (row: Transaction) => {
        const icons = {
          'Deposit': <ArrowDownLeft size={12} className="text-emerald-400" />,
          'Withdrawal': <ArrowUpRight size={12} className="text-rose-400" />,
          'Prize': <Award size={12} className="text-orange-400" />,
          'Entry Fee': <Coins size={12} className="text-sky-400" />,
          'Bonus': <Award size={12} className="text-emerald-400" />
        };
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-bold">
              {icons[row.type]}
              <span>{row.type}</span>
            </div>
            {row.remarks && <span className="text-[9px] text-textGray mt-0.5 font-medium">{row.remarks}</span>}
          </div>
        );
      }
    },
    {
      header: 'Amount',
      accessor: (row: Transaction) => {
        const isAdd = row.type === 'Deposit' || row.type === 'Prize' || row.type === 'Bonus';
        return (
          <span className={`font-black ${isAdd ? 'text-emerald-400' : 'text-red-400'}`}>
            {isAdd ? '+' : '-'}₹{row.amount}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: (row: Transaction) => (
        <Badge variant={
          row.status === 'Approved' || row.status === 'Completed'
            ? 'success'
            : row.status === 'Pending'
            ? 'warning'
            : 'danger'
        }>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'UTR / Ref',
      accessor: (row: Transaction) => row.utrNumber
        ? <span className="text-xs font-mono text-textGray">{row.utrNumber}</span>
        : <span className="text-xs text-slate-600">—</span>
    },
    {
      header: 'Process Action',
      accessor: (row: Transaction) => {
        if (row.type === 'Withdrawal' && row.status === 'Pending') {
          return (
            <div className="flex flex-col gap-1.5">
              {row.playerUpiId && (
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                  <span className="text-[10px] font-mono text-rose-400">{row.playerUpiId}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button size="xs" variant="success" disabled={submittingId !== null} onClick={() => handleProcessWithdrawal(row.id, 'approve')}>Approve</Button>
                <Button size="xs" variant="danger" disabled={submittingId !== null} onClick={() => handleProcessWithdrawal(row.id, 'reject')}>Reject</Button>
              </div>
            </div>
          );
        }
        if (row.type === 'Deposit' && row.status === 'Pending') {
          return (
            <div className="flex items-center gap-2">
              <Button size="xs" variant="success" disabled={submittingId !== null} onClick={() => handleProcessDeposit(row.id, 'approve')}>Approve</Button>
              <Button size="xs" variant="danger" disabled={submittingId !== null} onClick={() => handleProcessDeposit(row.id, 'reject')}>Reject</Button>
            </div>
          );
        }
        return <span className="text-xs text-slate-500 italic">No action needed</span>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Wallet Manager</h1>
          <p className="text-xs text-textGray font-semibold mt-1">
            Audit player deposits, distribute prize pool pools, and authorize pending cash-out requests
          </p>
        </div>
        <Button size="sm" variant="outline" icon={<RefreshCw size={14} />} onClick={fetchTransactions}>
          Refresh Ledger
        </Button>
      </div>

      {alertMsg && (
        <Alert type={alertMsg.type} onClose={() => setAlertMsg(null)}>
          {alertMsg.text}
        </Alert>
      )}

      {/* Quick stats totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-textGray font-bold uppercase">
            <span>Total Capital Flows</span>
            <Coins size={16} className="text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-white mt-3">₹{totalVolume} INR</h2>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-textGray font-bold uppercase">
            <span>Aggregated Deposits</span>
            <ArrowDownLeft size={16} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-emerald-400 mt-3">₹{totalDeposited} INR</h2>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-textGray font-bold uppercase">
            <span>Approved Withdrawals</span>
            <ArrowUpRight size={16} className="text-rose-400" />
          </div>
          <h2 className="text-2xl font-black text-rose-400 mt-3">₹{totalWithdrawn} INR</h2>
        </Card>
      </div>

      {pendingWithdrawals.length > 0 && (
        <Card title="⏳ Pending Withdrawals" subtitle="Funds held in escrow — verify player UPI ID and approve/reject">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingWithdrawals.map(tx => (
              <div key={tx.id} className="p-4 bg-slate-950 border border-rose-500/20 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{tx.userName}</h4>
                    <span className="text-[10px] text-textGray font-semibold">#{tx.id}</span>
                  </div>
                  <span className="text-rose-400 font-extrabold text-base">₹{tx.amount} INR</span>
                </div>

                {tx.playerUpiId && (
                  <div className="bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-textGray font-bold uppercase">Payout UPI ID</p>
                      <p className="text-xs font-mono font-bold text-white mt-0.5">{tx.playerUpiId}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tx.playerUpiId || '');
                        alert("UPI ID Copied!");
                      }}
                      className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-md font-semibold hover:bg-primary/20 transition"
                    >
                      Copy
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">{new Date(tx.date).toLocaleString()}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" disabled={submittingId !== null} onClick={() => handleProcessWithdrawal(tx.id, 'approve')}>Approve</Button>
                    <Button size="sm" variant="danger" disabled={submittingId !== null} onClick={() => handleProcessWithdrawal(tx.id, 'reject')}>Reject</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PENDING DEPOSIT REQUESTS */}
      {pendingDeposits.length > 0 && (
        <Card title="💰 Pending Deposit Requests" subtitle="Verify UTR and credit player wallets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDeposits.map(tx => (
              <div key={tx.id} className="p-4 bg-slate-950 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{tx.userName}</h4>
                    <p className="text-xs text-textGray mt-0.5">#{tx.id}</p>
                  </div>
                  <span className="text-emerald-400 font-black text-lg">+₹{tx.amount}</span>
                </div>

                {tx.utrNumber && (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-textGray font-bold uppercase">UTR / Transaction Ref</p>
                    <p className="text-xs font-mono font-bold text-white mt-0.5">{tx.utrNumber}</p>
                  </div>
                )}

                <p className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleString()}</p>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="success" className="flex-1" disabled={submittingId !== null} onClick={() => handleProcessDeposit(tx.id, 'approve')}>
                    ✅ Approve & Credit
                  </Button>
                  <Button size="sm" variant="danger" className="flex-1" disabled={submittingId !== null} onClick={() => handleProcessDeposit(tx.id, 'reject')}>
                    ❌ Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ledger search & filter controller */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textGray">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs text-white placeholder-slate-600 outline-none transition"
            />
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase">
            <div className="flex items-center gap-1">
              <span className="text-textGray text-[10px]">Status:</span>
              <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg">
                {(['All', 'Pending', 'Approved', 'Rejected', 'Completed'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] tracking-wide transition ${
                      statusFilter === s ? 'orange-gradient-bg text-white' : 'text-textGray hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-textGray text-[10px]">Type:</span>
              <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg">
                {(['All', 'Deposit', 'Withdrawal', 'Prize', 'Entry Fee', 'Bonus'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setTypeFilter(t);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] tracking-wide transition ${
                      typeFilter === t ? 'orange-gradient-bg text-white' : 'text-textGray hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROMOTIONAL BONUS CARD */}
      <div className="grid grid-cols-1 gap-6">
        <Card title="🎁 Give Promotional Festival Bonus" subtitle="Distribute play credits to all or specific users with a notification message">
          <form onSubmit={handleSendBonus} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Target Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Target Recipient *</label>
                <select
                  value={bonusTarget}
                  onChange={(e) => setBonusTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none"
                >
                  <option value="all">All Registered Players (Bulk)</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Bonus Amount (INR) *</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  required
                  min={1}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none"
                />
              </div>

              {/* Remarks/Message */}
              <div className="space-y-1">
                <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Notification Message *</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Dhamaka Bonus"
                  value={bonusMessage}
                  onChange={(e) => setBonusMessage(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={bonusSubmitting} className="w-full md:w-auto">
                Distribute Bonus Balance
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Main Ledger Table */}
      <Card title="Transactional Ledger Audits">
        <Table
          columns={columns}
          data={paginatedTransactions}
          loading={loading}
          emptyMessage="No ledger records matching filters."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>
    </div>
  );
};

export default WalletManagement;
