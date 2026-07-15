import React, { useEffect, useState } from 'react';
import { Trophy, Search, CheckCircle, RefreshCw, Users, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

interface Tournament {
  id: string;
  name: string;
  gameMode: 'Solo' | 'Duo' | 'Squad';
  entryFee: number;
  prizePool: number;
  map: string;
  date: string;
  time: string;
  maxSlots: number;
  joinedCount: number;
  status: string;
}

interface TeamMember {
  ffUid: string;
  ffName: string;
}

export const JoinTournament: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMap, setSelectedMap] = useState('All');

  // Registration action states
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Team registration modal states
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamModalTournament, setTeamModalTournament] = useState<Tournament | null>(null);
  const [teammates, setTeammates] = useState<TeamMember[]>([]);
  const [teamSubmitting, setTeamSubmitting] = useState(false);

  const fetchTournaments = async () => {
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch('/api/tournaments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setTournaments(data);
        const profileRes = await fetch(`/api/players/${user?.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (profileData && Array.isArray(profileData.tournaments)) {
          setRegisteredIds(profileData.tournaments.map((t: any) => t.id));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [user?.id]);

  // Opens team modal for Duo/Squad, direct join for Solo
  const handleJoinClick = (tournament: Tournament) => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!user?.inGameName || !user?.inGameUid) {
      setErrorMsg("You must configure your Free Fire In-Game Name and UID in your profile settings before joining.");
      return;
    }

    if (user.walletBalance < tournament.entryFee) {
      setErrorMsg("Insufficient wallet balance. Please add funds to your wallet first.");
      return;
    }

    if (tournament.gameMode === 'Solo') {
      // Solo: direct join, no team needed
      handleJoinSubmit(tournament.id, tournament.entryFee, []);
    } else {
      // Duo or Squad: open team modal
      const count = tournament.gameMode === 'Duo' ? 1 : 3;
      setTeammates(Array.from({ length: count }, () => ({ ffUid: '', ffName: '' })));
      setTeamModalTournament(tournament);
      setTeamModalOpen(true);
    }
  };

  const handleTeammateChange = (index: number, field: 'ffUid' | 'ffName', value: string) => {
    setTeammates(prev => prev.map((tm, i) => i === index ? { ...tm, [field]: value } : tm));
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamModalTournament) return;

    // Validate all filled
    for (const tm of teammates) {
      if (!tm.ffUid.trim() || !tm.ffName.trim()) {
        setErrorMsg("Please fill in all teammate Free Fire UIDs and Names.");
        return;
      }
    }
    setErrorMsg('');
    await handleJoinSubmit(teamModalTournament.id, teamModalTournament.entryFee, teammates);
  };

  const handleJoinSubmit = async (tournamentId: string, _fee: number, teammatesData: TeamMember[]) => {
    setJoiningId(tournamentId);
    setTeamSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const body: any = {};
      if (teammatesData.length > 0) {
        body.teammates = teammatesData;
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.message || "Failed to register for this tournament");
      } else {
        setSuccessMsg(data.message || "Registration successful!");
        setRegisteredIds(prev => [...prev, tournamentId]);
        setTeamModalOpen(false);
        await refreshProfile();
        setTournaments(prev => prev.map(t => {
          if (t.id === tournamentId) {
            return { ...t, joinedCount: t.joinedCount + 1 };
          }
          return t;
        }));
      }
    } catch (err) {
      setErrorMsg("Network error occurred. Please try again.");
    } finally {
      setJoiningId(null);
      setTeamSubmitting(false);
    }
  };

  // Filter logic
  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesMap = selectedMap === 'All' || t.map === selectedMap;
    return matchesSearch && matchesMap && t.status === 'Upcoming';
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Team Registration Modal for Duo/Squad */}
      <Modal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        title={teamModalTournament ? `Register ${teamModalTournament.gameMode} Team — ${teamModalTournament.name}` : ''}
      >
        {teamModalTournament && (
          <form onSubmit={handleTeamSubmit} className="space-y-5">
            {/* Entry fee info */}
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
              <span className="text-xs text-textGray font-semibold">Entry Fee</span>
              <span className="text-sm font-black text-primary">₹{teamModalTournament.entryFee} INR</span>
            </div>

            {/* Captain (you) — auto filled */}
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-textGray flex items-center gap-1.5">
                <User size={12} className="text-orange-400" /> You (Captain)
              </p>
              <div className="grid grid-cols-2 gap-3 bg-slate-900/40 border border-slate-800/60 rounded-xl p-3">
                <div>
                  <span className="text-[10px] text-textGray uppercase font-bold">FF In-Game Name</span>
                  <p className="text-sm font-bold text-white mt-1">{user?.inGameName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-textGray uppercase font-bold">FF UID</span>
                  <p className="text-sm font-bold text-white font-mono mt-1">{user?.inGameUid}</p>
                </div>
              </div>
            </div>

            {/* Teammates */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-textGray flex items-center gap-1.5">
                <Users size={12} className="text-orange-400" /> Teammates ({teammates.length})
              </p>
              {teammates.map((tm, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold text-textGray uppercase">
                    Player {i + 2}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-textGray font-bold uppercase block mb-1">FF In-Game Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. KILL3R_X"
                        value={tm.ffName}
                        onChange={e => handleTeammateChange(i, 'ffName', e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-textGray font-bold uppercase block mb-1">Free Fire UID *</label>
                      <input
                        type="text"
                        placeholder="e.g. 987654321"
                        value={tm.ffUid}
                        onChange={e => handleTeammateChange(i, 'ffUid', e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

            <div className="flex gap-3 border-t border-slate-800 pt-5">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setTeamModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={teamSubmitting}>
                Register Team & Pay ₹{teamModalTournament.entryFee}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Join Tournament</h1>
          <p className="text-xs text-textGray font-semibold mt-1">
            Browse active brackets and register your participation
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center justify-between min-w-[200px]">
          <span className="text-xs text-textGray font-bold">Your Wallet Balance</span>
          <span className="text-sm font-black text-primary">₹{user?.walletBalance} INR</span>
        </div>
      </div>

      {!(user?.inGameName && user?.inGameUid) && (
        <Alert type="warning">
          You must set your Free Fire In-Game Name (IGN) and UID in your profile before you can join tournaments. <Link to="/player/profile" className="underline font-bold text-amber-300 hover:text-amber-200">Go to Profile Settings</Link>
        </Alert>
      )}

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg && !teamModalOpen && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      {/* Filter Toolbar */}
      <Card className="py-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by tournament name..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-0"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <select
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              className="flex-1 sm:w-44 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-textWhite focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
            >
              <option value="All">All Maps</option>
              <option value="Bermuda">Bermuda</option>
              <option value="Purgatory">Purgatory</option>
              <option value="Kalahari">Kalahari</option>
              <option value="Alpine">Alpine</option>
            </select>
            <Button variant="outline" onClick={fetchTournaments} title="Refresh Lists" icon={<RefreshCw size={14} />} />
          </div>
        </div>
      </Card>

      {/* Tournaments Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="text-center py-16 bg-cardBg border border-slate-800 rounded-2xl text-textGray">
          <Trophy size={48} className="mx-auto mb-4 opacity-25" />
          <p className="text-sm font-bold">No upcoming tournaments match your criteria.</p>
          <p className="text-xs mt-1">Check back later for new lobby updates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((t) => {
            const isRegistered = registeredIds.includes(t.id);
            const isFull = t.joinedCount >= t.maxSlots;
            const modeIcon = t.gameMode === 'Solo'
              ? <User size={12} />
              : <Users size={12} />;

            return (
              <Card key={t.id} hoverGlow className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Badge>{t.status}</Badge>
                    <span className="flex items-center gap-1 text-xs text-textGray font-bold uppercase">
                      {modeIcon} {t.gameMode}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5">{t.name}</h3>
                  <p className="text-xs text-textGray mb-5">Map: {t.map} | Start: {t.date} {t.time}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-textGray tracking-wider">Prize Pool</span>
                      <span className="text-sm font-extrabold text-primary">₹{t.prizePool}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-textGray tracking-wider">Entry Fee</span>
                      <span className="text-sm font-extrabold text-white">₹{t.entryFee}</span>
                    </div>
                  </div>

                  {/* Team size hint for Duo/Squad */}
                  {t.gameMode !== 'Solo' && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <Users size={13} className="text-orange-400 shrink-0" />
                      <span className="text-[11px] text-orange-300 font-semibold">
                        {t.gameMode === 'Duo'
                          ? 'You + 1 teammate required to register'
                          : 'You + 3 teammates required to register'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between mt-auto">
                  <span className="text-xs text-textGray font-semibold">
                    Slots: {t.joinedCount} / {t.maxSlots}
                  </span>

                  {isRegistered ? (
                    <Button variant="outline" disabled className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                      <CheckCircle size={14} className="mr-1.5" />
                      Registered
                    </Button>
                  ) : isFull ? (
                    <Button variant="outline" disabled>
                      Lobby Full
                    </Button>
                  ) : (
                    <Button
                      loading={joiningId === t.id}
                      onClick={() => handleJoinClick(t)}
                    >
                      {t.gameMode === 'Solo' ? 'Join Match' : `Register ${t.gameMode}`}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default JoinTournament;
