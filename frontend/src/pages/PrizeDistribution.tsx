import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

interface Tournament {
  id: string;
  name: string;
  gameMode: string;
  status: string;
}

interface Match {
  id: string;
  tournamentId: string;
  tournamentName: string;
  roomId: string;
  startTime: string;
  status: string;
  resultsUploaded: boolean;
}

interface Player {
  id: string;
  name: string;
  email: string;
}

interface PlayerResult {
  playerId: string;
  playerName: string;
  rank: number;
  kills: number;
  points: number;
  prizeAwarded: number;
}

export const PrizeDistribution: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [matchDetails, setMatchDetails] = useState<{ match: Match; result: { results: PlayerResult[] } | null; players: Player[] } | null>(null);
  
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic result form values
  // Mapping: playerId -> { rank, kills, points, prize }
  const [formValues, setFormValues] = useState<Record<string, { rank: string; kills: string; points: string; prize: string }>>({});

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const token = localStorage.getItem('firex_token');
        const res = await fetch('/api/tournaments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setTournaments(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTournaments(false);
      }
    };
    fetchTournaments();
  }, []);

  const handleTournamentChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setSelectedTournamentId(tId);
    setSelectedMatchId('');
    setMatchDetails(null);
    setMatches([]);
    
    if (!tId) return;

    setLoadingMatches(true);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/matches?tournamentId=${tId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMatches(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleMatchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mId = e.target.value;
    setSelectedMatchId(mId);
    setMatchDetails(null);
    
    if (!mId) return;

    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/matches/${mId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMatchDetails(data);
        
        // Initialize form fields for each player
        const initialForm: Record<string, { rank: string; kills: string; points: string; prize: string }> = {};
        data.players.forEach((p: Player) => {
          initialForm[p.id] = { rank: '', kills: '0', points: '0', prize: '0' };
        });
        setFormValues(initialForm);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInputChange = (playerId: string, field: 'rank' | 'kills' | 'points' | 'prize', value: string) => {
    setFormValues(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value
      }
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !matchDetails) return;
    setAlertMsg(null);

    // Validate form inputs
    const resultsPayload: any[] = [];
    let validationFailed = false;

    matchDetails.players.forEach(p => {
      const vals = formValues[p.id];
      if (!vals || !vals.rank) {
        validationFailed = true;
        return;
      }
      resultsPayload.push({
        playerId: p.id,
        rank: Number(vals.rank),
        kills: Number(vals.kills) || 0,
        points: Number(vals.points) || 0,
        prizeAwarded: Number(vals.prize) || 0
      });
    });

    if (validationFailed) {
      setAlertMsg({ type: 'error', text: 'All players must be assigned a finish placement Rank.' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/matches/${selectedMatchId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ results: resultsPayload })
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: 'Prizes distributed successfully! Wallet balances updated.' });
        
        // Refresh detail screen
        const refreshRes = await fetch(`/api/matches/${selectedMatchId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setMatchDetails(refreshData);
        }
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to submit match results.' });
      }
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: 'error', text: 'Network connection error.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Prize Allocator</h1>
        <p className="text-xs text-textGray font-semibold mt-1">
          Input match results (kills, rank, points) and credit winner wallets instantly
        </p>
      </div>

      {alertMsg && (
        <Alert type={alertMsg.type} onClose={() => setAlertMsg(null)}>
          {alertMsg.text}
        </Alert>
      )}

      {/* Select Match Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="space-y-2">
          <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">1. Select Tournament</label>
          {loadingTournaments ? (
            <div className="h-10 bg-slate-950/60 animate-pulse rounded-lg border border-slate-800" />
          ) : (
            <select
              value={selectedTournamentId}
              onChange={handleTournamentChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none transition"
            >
              <option value="">-- Choose a Tournament --</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">2. Select Match Room</label>
          {loadingMatches ? (
            <div className="h-10 bg-slate-950/60 animate-pulse rounded-lg border border-slate-800" />
          ) : (
            <select
              value={selectedMatchId}
              onChange={handleMatchChange}
              disabled={!selectedTournamentId}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-primary disabled:opacity-40 rounded-lg text-xs font-semibold text-white outline-none transition"
            >
              <option value="">-- Choose a Match --</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  Room {m.roomId} - {m.status} {m.resultsUploaded ? '(Results Uploaded)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loadingDetails && (
        <div className="py-20 flex justify-center items-center">
          <Loader />
        </div>
      )}

      {/* Main Details Panel */}
      {!loadingDetails && matchDetails && (
        <div className="space-y-6">
          {/* Match summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800 p-4">
              <span className="text-[10px] text-textGray font-bold uppercase block">Lobby Room ID</span>
              <span className="text-base font-black text-white mt-1 block">#{matchDetails.match.roomId}</span>
            </Card>
            <Card className="bg-slate-900 border-slate-800 p-4">
              <span className="text-[10px] text-textGray font-bold uppercase block">Start Date/Time</span>
              <span className="text-xs font-bold text-white mt-1 block">
                {new Date(matchDetails.match.startTime).toLocaleString()}
              </span>
            </Card>
            <Card className="bg-slate-900 border-slate-800 p-4">
              <span className="text-[10px] text-textGray font-bold uppercase block">Status</span>
              <div className="mt-1">
                <Badge variant={matchDetails.match.status === 'Live' ? 'success' : matchDetails.match.status === 'Completed' ? 'neutral' : 'warning'}>
                  {matchDetails.match.status}
                </Badge>
              </div>
            </Card>
            <Card className="bg-slate-900 border-slate-800 p-4">
              <span className="text-[10px] text-textGray font-bold uppercase block">Standings Ledger</span>
              <span className="text-xs font-bold mt-1 block">
                {matchDetails.match.resultsUploaded ? (
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1"><CheckCircle size={14} /> Finalized</span>
                ) : (
                  <span className="text-yellow-400 font-extrabold flex items-center gap-1"><AlertCircle size={14} /> Open Form</span>
                )}
              </span>
            </Card>
          </div>

          {/* Results Display or Input Form */}
          {matchDetails.match.resultsUploaded && matchDetails.result ? (
            <Card title="Finalized Leaderboard Standing & Prizes" subtitle="Funds have been credited to player wallets">
              <div className="overflow-x-auto border border-slate-800 rounded-lg bg-cardBg">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs text-textWhite font-medium">
                  <thead className="bg-slate-900/50 uppercase font-bold text-textGray text-[10px]">
                    <tr>
                      <th className="px-6 py-3">Rank</th>
                      <th className="px-6 py-3">Player</th>
                      <th className="px-6 py-3 text-right">Kills</th>
                      <th className="px-6 py-3 text-right">Placement Points</th>
                      <th className="px-6 py-3 text-right">Prize Awarded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-semibold">
                    {matchDetails.result.results.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-800/20">
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-1 rounded text-xs font-black ${
                            r.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                            r.rank === 2 ? 'bg-slate-300/20 text-slate-300' :
                            r.rank === 3 ? 'bg-amber-600/20 text-amber-500' : 'bg-slate-800 text-textGray'
                          }`}>
                            #{r.rank}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold">{r.playerName}</td>
                        <td className="px-6 py-3.5 text-right">{r.kills}</td>
                        <td className="px-6 py-3.5 text-right">{r.points}</td>
                        <td className="px-6 py-3.5 text-right text-emerald-400 font-black">
                          {r.prizeAwarded > 0 ? `+₹${r.prizeAwarded} INR` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Card title="Input Match Statistics" subtitle="Assign ranks, points, and prizes for registered brackets">
                {matchDetails.players.length === 0 ? (
                  <div className="text-center py-12 text-xs italic text-textGray">
                    No players are registered in this tournament bracket.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-lg bg-cardBg">
                    <table className="min-w-full divide-y divide-slate-800 text-left text-xs text-textWhite font-medium">
                      <thead className="bg-slate-900/50 uppercase font-bold text-textGray text-[10px]">
                        <tr>
                          <th className="px-6 py-3 w-28">Rank</th>
                          <th className="px-6 py-3">Player Name</th>
                          <th className="px-6 py-3 text-right">Kills</th>
                          <th className="px-6 py-3 text-right">Points</th>
                          <th className="px-6 py-3 text-right">Prize (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-semibold">
                        {matchDetails.players.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/10">
                            <td className="px-6 py-3.5">
                              <input
                                type="number"
                                placeholder="Rank"
                                required
                                min="1"
                                value={formValues[p.id]?.rank || ''}
                                onChange={(e) => handleInputChange(p.id, 'rank', e.target.value)}
                                className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 focus:border-primary text-xs rounded text-white outline-none"
                              />
                            </td>
                            <td className="px-6 py-3.5 font-bold">{p.name}</td>
                            <td className="px-6 py-3.5 text-right">
                              <input
                                type="number"
                                min="0"
                                value={formValues[p.id]?.kills || '0'}
                                onChange={(e) => handleInputChange(p.id, 'kills', e.target.value)}
                                className="w-16 text-right px-2 py-1 bg-slate-950 border border-slate-800 focus:border-primary text-xs rounded text-white outline-none"
                              />
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <input
                                type="number"
                                min="0"
                                value={formValues[p.id]?.points || '0'}
                                onChange={(e) => handleInputChange(p.id, 'points', e.target.value)}
                                className="w-16 text-right px-2 py-1 bg-slate-950 border border-slate-800 focus:border-primary text-xs rounded text-white outline-none"
                              />
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <input
                                type="number"
                                min="0"
                                value={formValues[p.id]?.prize || '0'}
                                onChange={(e) => handleInputChange(p.id, 'prize', e.target.value)}
                                className="w-24 text-right px-2 py-1 bg-slate-950 border border-slate-800 focus:border-primary text-xs rounded text-white text-emerald-400 outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {matchDetails.players.length > 0 && (
                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    icon={<Save size={14} />}
                    disabled={submitting}
                  >
                    {submitting ? 'Allocating Wallet Credits...' : 'Finalize & Credit Wallets'}
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default PrizeDistribution;
