import React, { useEffect, useState } from 'react';
import { Search, Ban, Trash2, Eye, ShieldAlert, CreditCard, Trophy } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

interface Player {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  isBanned: boolean;
  inGameName?: string;
  inGameUid?: string;
}

interface Tournament {
  id: string;
  name: string;
  gameMode: string;
  entryFee: number;
  prizePool: number;
  status: string;
}

interface MatchResult {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  rank: number;
  kills: number;
  points: number;
  prize: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
}

interface PlayerDetailData {
  player: Player;
  tournaments: Tournament[];
  matchResults: MatchResult[];
  transactions: Transaction[];
}

export const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<PlayerDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [playerToDeleteId, setPlayerToDeleteId] = useState<string | null>(null);
  const [playerToDeleteName, setPlayerToDeleteName] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('firex_token');
      let url = '/api/players';
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (filter !== 'all') params.push(`filter=${filter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlayers(data);
      }
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Failed to retrieve players.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [filter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlayers();
  };

  const handleBanToggle = async (player: Player) => {
    const targetStatus = !player.isBanned;
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/players/${player.id}/ban`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ban: targetStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: `Player "${player.name}" has been ${targetStatus ? 'Banned' : 'Unbanned'} successfully.`
        });
        setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, isBanned: targetStatus } : p));
        if (detailData && detailData.player.id === player.id) {
          setDetailData({
            ...detailData,
            player: { ...detailData.player, isBanned: targetStatus }
          });
        }
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to update player ban status.' });
      }
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Network connection failure.' });
    }
  };

  const confirmDeletePlayer = (id: string, name: string) => {
    setPlayerToDeleteId(id);
    setPlayerToDeleteName(name);
    setDeleteOpen(true);
  };

  const handleDeletePlayer = async () => {
    if (!playerToDeleteId || !playerToDeleteName) return;
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/players/${playerToDeleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: `Player account "${playerToDeleteName}" deleted successfully.` });
        setPlayers(prev => prev.filter(p => p.id !== playerToDeleteId));
        setSelectedPlayerId(null);
        setDetailData(null);
        setDeleteOpen(false);
        setPlayerToDeleteId(null);
        setPlayerToDeleteName(null);
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to delete player.' });
      }
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Network connection failure.' });
    }
  };

  const handleViewDetails = async (id: string) => {
    setSelectedPlayerId(id);
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/players/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      } else {
        setAlertMsg({ type: 'error', text: 'Failed to load player details.' });
        setSelectedPlayerId(null);
      }
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Network error loading player profiles.' });
      setSelectedPlayerId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Slice players for local pagination
  const totalPages = Math.ceil(players.length / itemsPerPage);
  const paginatedPlayers = players.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      header: 'Player ID',
      accessor: (row: Player) => <span className="font-mono text-xs text-textGray">#{row.id}</span>
    },
    {
      header: 'Name',
      accessor: (row: Player) => <span className="font-bold text-white">{row.name}</span>
    },
    {
      header: 'Email',
      accessor: 'email' as keyof Player
    },
    {
      header: 'Wallet Balance',
      accessor: (row: Player) => <span className="font-bold text-primary">₹{row.walletBalance} INR</span>
    },
    {
      header: 'Status',
      accessor: (row: Player) => (
        <Badge variant={row.isBanned ? 'danger' : 'success'}>
          {row.isBanned ? 'Banned' : 'Active'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row: Player) => (
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            icon={<Eye size={12} />}
            onClick={() => handleViewDetails(row.id)}
            title="Inspect Profile"
          />
          <Button
            size="xs"
            variant={row.isBanned ? 'success' : 'warning'}
            icon={<Ban size={12} />}
            onClick={() => handleBanToggle(row)}
            title={row.isBanned ? 'Unban Player' : 'Ban Player'}
          />
          <Button
            size="xs"
            variant="danger"
            icon={<Trash2 size={12} />}
            onClick={() => confirmDeletePlayer(row.id, row.name)}
            title="Delete Account"
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Player Management</h1>
          <p className="text-xs text-textGray font-semibold mt-1">
            Audit player profiles, adjust standings, modify ban listings, and audit ledgers
          </p>
        </div>
      </div>

      {/* Alert bulletins */}
      {alertMsg && (
        <Alert
          type={alertMsg.type}
          onClose={() => setAlertMsg(null)}
          className="animate-fade-in"
        >
          {alertMsg.text}
        </Alert>
      )}

      {/* Search and Filters row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-textGray">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <span className="text-xs font-bold uppercase text-textGray">Status Filter:</span>
          {(['all', 'active', 'banned'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setFilter(mode);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                filter === mode
                  ? 'orange-gradient-bg text-white shadow'
                  : 'bg-slate-950 border border-slate-800 text-textGray hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Database Player Table */}
      <Card title="Player Directory Listings">
        <Table
          columns={columns}
          data={paginatedPlayers}
          loading={loading}
          emptyMessage="No registered player accounts matching filter terms."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </Card>

      {/* Player profile detailed view drawer / modal */}
      <Modal
        isOpen={selectedPlayerId !== null}
        onClose={() => {
          setSelectedPlayerId(null);
          setDetailData(null);
        }}
        title={detailData ? `Audit: ${detailData.player.name}` : 'Loading player profile...'}
        size="lg"
        footer={
          detailData && (
            <div className="flex justify-between items-center w-full">
              <Button
                variant={detailData.player.isBanned ? 'success' : 'warning'}
                size="sm"
                icon={<Ban size={14} />}
                onClick={() => handleBanToggle(detailData.player)}
              >
                {detailData.player.isBanned ? 'Unban Account' : 'Ban Account'}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() => confirmDeletePlayer(detailData.player.id, detailData.player.name)}
                >
                  Delete Account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPlayerId(null);
                    setDetailData(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )
        }
      >
        {detailLoading && (
          <div className="py-20 flex justify-center items-center">
            <Loader />
          </div>
        )}

        {!detailLoading && detailData && (
          <div className="space-y-6">
            {/* Quick summary header */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider">Account ID</span>
                <p className="text-xs font-mono text-white font-bold mt-0.5">#{detailData.player.id}</p>
              </div>
              <div>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider">Email Address</span>
                <p className="text-xs font-bold text-white mt-0.5 truncate" title={detailData.player.email}>{detailData.player.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider">Free Fire IGN</span>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{detailData.player.inGameName || 'Not Set'}</p>
              </div>
              <div>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider">Free Fire UID</span>
                <p className="text-xs font-bold text-white font-mono mt-0.5">{detailData.player.inGameUid || 'Not Set'}</p>
              </div>
              <div>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider">Wallet Balance</span>
                <p className="text-xs font-black text-primary mt-0.5">₹{detailData.player.walletBalance}</p>
              </div>
            </div>

            {/* Main info tabs structure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tournaments enrolled in */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <Trophy size={14} className="text-orange-500" /> Registered Brackets ({detailData.tournaments.length})
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {detailData.tournaments.length === 0 ? (
                    <p className="p-4 text-xs text-textGray italic text-center">No tournament enrollments logged.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/60">
                      {detailData.tournaments.map((t) => (
                        <div key={t.id} className="p-3 flex justify-between items-center text-xs font-semibold">
                          <div>
                            <span className="block text-white font-bold truncate max-w-[170px]">{t.name}</span>
                            <span className="text-[10px] text-slate-500">{t.gameMode} bracket</span>
                          </div>
                          <Badge variant={t.status === 'Live' ? 'success' : t.status === 'Completed' ? 'neutral' : 'warning'}>
                            {t.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Match placements & results */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-orange-500" /> Match Placements ({detailData.matchResults.length})
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {detailData.matchResults.length === 0 ? (
                    <p className="p-4 text-xs text-textGray italic text-center">No matching leaderboard records found.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/60">
                      {detailData.matchResults.map((r, i) => (
                        <div key={i} className="p-3 flex justify-between items-center text-xs font-semibold">
                          <div>
                            <span className="block text-white font-bold truncate max-w-[170px]">{r.tournamentName}</span>
                            <span className="text-[10px] text-slate-500">Kills: {r.kills} | Points: {r.points}</span>
                          </div>
                          <div className="text-right">
                            <span className="block font-black text-white">Rank {r.rank}</span>
                            {r.prize > 0 && <span className="text-[10px] text-emerald-400 font-bold">+₹{r.prize}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Wallet transactions ledger */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                <CreditCard size={14} className="text-orange-500" /> Account Transaction History ({detailData.transactions.length})
              </h4>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {detailData.transactions.length === 0 ? (
                  <p className="p-4 text-xs text-textGray italic text-center">No transaction records found.</p>
                ) : (
                  <table className="min-w-full divide-y divide-slate-800 text-left text-xs text-textWhite">
                    <thead className="bg-slate-900/60 text-[10px] uppercase font-bold text-textGray">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                        <th className="px-4 py-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-semibold">
                      {detailData.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-4 py-2.5 text-slate-400">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 font-bold">{tx.type}</td>
                          <td className={`px-4 py-2.5 text-right font-black ${
                            tx.type === 'Deposit' || tx.type === 'Prize' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {tx.type === 'Deposit' || tx.type === 'Prize' ? '+' : '-'}₹{tx.amount}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Badge variant={tx.status === 'Approved' || tx.status === 'Completed' ? 'success' : tx.status === 'Pending' ? 'warning' : 'danger'}>
                              {tx.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Player Account">
        <div className="space-y-4">
          <p className="text-sm text-textGray leading-relaxed">
            Are you absolutely sure you want to permanently delete player account <span className="text-white font-bold">"{playerToDeleteName}"</span>? This action will erase their transaction logs and tournament brackets history. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-6">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDeletePlayer}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlayerManagement;
