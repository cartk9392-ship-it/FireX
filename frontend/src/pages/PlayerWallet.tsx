import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpCircle, RefreshCw, QrCode, Clock, CheckCircle, XCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import Table from '../components/Table';
import Loader from '../components/Loader';

interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Prize' | 'Entry Fee' | 'Bonus';
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  date: string;
  utrNumber?: string;
  remarks?: string;
}

const DEFAULT_QR = '/upi_qr.png'; // fallback if admin hasn't set QR yet

export const PlayerWallet: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');

  // Payment settings from backend (set by admin)
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [depositStep, setDepositStep] = useState<1 | 2>(1); // step1=scan QR, step2=enter UTR

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpiId, setWithdrawUpiId] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);

  const fetchWalletDetails = async () => {
    try {
      const token = localStorage.getItem('firex_token');
      // Fetch wallet transactions
      const response = await fetch('/api/wallet/my-wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && Array.isArray(data.transactions)) {
        setTransactions(data.transactions.sort((a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
      // Fetch admin UPI settings
      const settingsRes = await fetch('/api/settings');
      const settings = await settingsRes.json();
      if (settings) {
        setUpiId(settings.upiId || '');
        setUpiQrUrl(settings.upiQrUrl || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const handleCopyUPI = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  const handleDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const val = Number(depositAmount);
    if (!val || val < 10) {
      setErrorMsg("Minimum deposit amount is ₹10 INR.");
      return;
    }
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setErrorMsg("Please enter a valid UTR / Transaction Reference Number (min 6 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: val, utrNumber: utrNumber.trim() })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`✅ Deposit request of ₹${val} submitted! Admin will verify your UTR and credit your wallet shortly.`);
        setDepositAmount('');
        setUtrNumber('');
        setDepositStep(1);
        fetchWalletDetails();
      } else {
        setErrorMsg(data.message || "Failed to submit deposit request.");
      }
    } catch (err) {
      setErrorMsg("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const val = Number(withdrawAmount);
    if (!val || val <= 0) {
      setErrorMsg("Please enter a valid withdrawal amount.");
      return;
    }
    if (!withdrawUpiId.trim() || !withdrawUpiId.includes('@')) {
      setErrorMsg("Please enter a valid UPI ID (must contain @, e.g. name@paytm).");
      return;
    }
    if (user && user.walletBalance < val) {
      setErrorMsg("Insufficient wallet balance for this withdrawal.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: val, upiId: withdrawUpiId.trim() })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`Withdrawal request for ₹${val} INR submitted to ${withdrawUpiId.trim()}. Pending admin approval.`);
        setWithdrawAmount('');
        setWithdrawUpiId('');
        await refreshProfile();
        fetchWalletDetails();
      } else {
        setErrorMsg(data.message || "Failed to request withdrawal.");
      }
    } catch (err) {
      setErrorMsg("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Approved' || status === 'Completed') return <CheckCircle size={13} className="text-emerald-400" />;
    if (status === 'Rejected') return <XCircle size={13} className="text-red-400" />;
    return <Clock size={13} className="text-amber-400" />;
  };

  const columns = [
    {
      header: "Type",
      accessor: (row: Transaction) => (
        <div>
          <Badge variant={row.type === 'Bonus' ? 'success' : 'default'}>{row.type}</Badge>
          {row.remarks && <p className="text-[10px] text-textGray mt-0.5 font-semibold">{row.remarks}</p>}
        </div>
      )
    },
    {
      header: "Amount",
      accessor: (row: Transaction) => {
        const isAdd = row.type === 'Deposit' || row.type === 'Prize' || row.type === 'Bonus';
        return (
          <span className={`font-extrabold ${isAdd ? 'text-emerald-400' : 'text-red-400'}`}>
            {isAdd ? '+' : '-'} ₹{row.amount}
          </span>
        );
      }
    },
    {
      header: "Status",
      accessor: (row: Transaction) => (
        <span className="flex items-center gap-1.5">
          {getStatusIcon(row.status)}
          <span className={`text-xs font-bold ${
            row.status === 'Approved' || row.status === 'Completed' ? 'text-emerald-400' :
            row.status === 'Rejected' ? 'text-red-400' : 'text-amber-400'
          }`}>{row.status}</span>
        </span>
      )
    },
    {
      header: "UTR / Ref",
      accessor: (row: Transaction) => row.utrNumber
        ? <span className="text-xs font-mono text-textGray">{row.utrNumber}</span>
        : <span className="text-xs text-slate-600">—</span>
    },
    { header: "Date", accessor: (row: Transaction) => new Date(row.date).toLocaleString('en-IN') }
  ];

  if (loading) {
    return <Loader />;
  }

  const tabs = [
    { id: 'deposit', label: 'Add Money', icon: <QrCode size={14} /> },
    { id: 'withdraw', label: 'Withdraw', icon: <ArrowUpCircle size={14} /> },
    { id: 'history', label: 'History', icon: <Clock size={14} /> },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Wallet Manager</h1>
          <p className="text-xs text-textGray font-semibold mt-1">
            Add funds via UPI, request withdrawals, and track transactions
          </p>
        </div>
        <Button variant="outline" onClick={fetchWalletDetails} icon={<RefreshCw size={14} />} />
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600/20 via-slate-900 to-slate-900 border border-orange-500/20 rounded-2xl p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-textGray uppercase font-bold tracking-wider mb-1">Available Balance</p>
            <h2 className="text-4xl font-black text-white">₹{(user?.walletBalance ?? 0).toLocaleString('en-IN')}</h2>
            <p className="text-xs text-textGray mt-1">INR · FireX Wallet</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl">
            <Wallet size={36} className="text-orange-400" />
          </div>
        </div>
      </div>

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-textGray hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ADD MONEY TAB */}
      {activeTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: QR Code */}
          <Card title="Step 1 — Scan & Pay" subtitle="Use any UPI app to send money">
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${depositStep >= 1 ? 'bg-primary text-white' : 'bg-slate-800 text-textGray'}`}>1</div>
                <div className={`flex-1 h-0.5 ${depositStep >= 2 ? 'bg-primary' : 'bg-slate-800'}`} />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${depositStep >= 2 ? 'bg-primary text-white' : 'bg-slate-800 text-textGray'}`}>2</div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center bg-slate-950/40 border border-slate-800 rounded-xl p-4">
                {upiQrUrl ? (
                  <img
                    src={upiQrUrl}
                    alt="UPI QR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_QR; }}
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400">
                    <QrCode size={64} className="text-slate-300 mb-2" />
                    <p className="text-[11px] text-center text-slate-400">QR code not configured yet.<br/>Admin se contact karo.</p>
                  </div>
                )}
              </div>

              {/* UPI ID copy */}
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[10px] text-textGray font-bold uppercase">UPI ID</p>
                  <p className="text-sm font-black text-white font-mono">
                    {upiId || <span className="text-slate-500 italic text-xs font-normal">Not configured by admin</span>}
                  </p>
                </div>
                {upiId && (
                  <button
                    onClick={handleCopyUPI}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition"
                  >
                    {upiCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                )}
              </div>

              {/* App icons row */}
              <div className="flex items-center justify-center gap-4">
                <span className="text-[10px] text-textGray font-semibold">Pay via:</span>
                {['PhonePe', 'GPay', 'Paytm', 'BHIM'].map(app => (
                  <span key={app} className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">{app}</span>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => setDepositStep(2)}
              >
                I've Paid — Enter UTR Number →
              </Button>
            </div>
          </Card>

          {/* Step 2: Enter UTR */}
          <Card title="Step 2 — Submit UTR" subtitle="Enter your UPI transaction reference">
            <form onSubmit={handleDepositRequest} className="space-y-4">
              <div className={`transition-opacity ${depositStep < 2 ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                {/* Amount */}
                <div className="mb-4">
                  <label className="block text-xs text-textGray font-bold uppercase mb-1.5">Amount Paid (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray font-bold text-sm">₹</span>
                    <input
                      type="number"
                      placeholder="Enter exact amount paid"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      required
                      min={10}
                      className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition"
                    />
                  </div>
                  {depositAmount && Number(depositAmount) > 0 && (
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">
                      ₹1 GST Deducted. You will receive: ₹{Number(depositAmount) - 1} INR in wallet
                    </p>
                  )}
                </div>

                {/* UTR Number */}
                <div className="mb-4">
                  <label className="block text-xs text-textGray font-bold uppercase mb-1.5">UTR / Transaction ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012"
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm text-white font-mono placeholder-slate-600 outline-none transition"
                  />
                  <p className="text-[10px] text-textGray mt-1">
                    Find UTR in your UPI app → Transaction Details → Reference Number
                  </p>
                </div>

                {/* Info box */}
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-[11px] text-amber-300 leading-relaxed">
                    ⚠️ Once submitted, admin will verify your UTR within a few hours. Your wallet will be credited after approval.
                  </p>
                </div>

                <Button type="submit" className="w-full" loading={submitting}>
                  Submit Deposit Request
                </Button>
              </div>

              {depositStep < 2 && (
                <p className="text-center text-xs text-textGray mt-2">
                  Complete Step 1 first — scan QR and pay
                </p>
              )}
            </form>
          </Card>
        </div>
      )}

      {/* WITHDRAW TAB */}
      {activeTab === 'withdraw' && (
        <Card title="Request Withdrawal" subtitle="Funds will be processed after admin approval">
          <div className="max-w-md mx-auto">
            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center mb-2">
                <span className="text-xs text-textGray font-semibold">Available Balance</span>
                <span className="text-sm font-black text-primary">₹{(user?.walletBalance ?? 0).toLocaleString('en-IN')} INR</span>
              </div>

              <div>
                <label className="block text-xs text-textGray font-bold uppercase mb-1.5">Withdrawal Amount (INR) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray font-bold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="Enter amount to withdraw"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    required
                    min={2}
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
                {withdrawAmount && Number(withdrawAmount) > 0 && (
                  <p className="text-[10px] text-red-400 font-bold mt-1">
                    ₹1 Flat payout processing fee. You will receive: ₹{Number(withdrawAmount) - 1} INR in UPI
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-textGray font-bold uppercase mb-1.5">Your UPI ID for Payout *</label>
                <input
                  type="text"
                  placeholder="e.g. phonepeNumber@ybl or upiid@paytm"
                  value={withdrawUpiId}
                  onChange={e => setWithdrawUpiId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition font-mono"
                />
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[11px] text-textGray leading-relaxed">
                  💡 Funds will be held in escrow until admin approves. If rejected, the amount is automatically refunded to your wallet.
                </p>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full border-red-500/30 hover:bg-red-950/20 text-red-400"
                loading={submitting}
                icon={<ArrowUpCircle size={15} />}
              >
                Submit Withdrawal Request
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <Card title="Transaction History" subtitle="All deposits, withdrawals, prizes and entry fees">
          <Table
            columns={columns}
            data={transactions}
            emptyMessage="No transactions on your account yet."
          />
        </Card>
      )}
    </div>
  );
};
export default PlayerWallet;
