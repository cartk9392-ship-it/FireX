import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash, Globe, RefreshCw, Users } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

interface Tournament {
  id: string;
  name: string;
  gameMode: 'Solo' | 'Duo' | 'Squad';
  entryFee: number;
  prizePool: number;
  map: 'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine';
  date: string;
  time: string;
  maxSlots: number;
  joinedCount: number;
  status: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
  published: boolean;
}

export const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<string | null>(null);

  // Team viewer state
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [teamsData, setTeamsData] = useState<{ gameMode: string; entries: any[] } | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsTournamentName, setTeamsTournamentName] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [gameMode, setGameMode] = useState<'Solo' | 'Duo' | 'Squad'>('Solo');
  const [entryFee, setEntryFee] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [map, setMap] = useState<'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine'>('Bermuda');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxSlots, setMaxSlots] = useState('');
  const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Completed' | 'Cancelled'>('Upcoming');

  const [submitting, setSubmitting] = useState(false);

  const fetchTournaments = async () => {
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch('/api/tournaments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setTournaments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const resetForm = () => {
    setName('');
    setGameMode('Solo');
    setEntryFee('');
    setPrizePool('');
    setMap('Bermuda');
    setDate('');
    setTime('');
    setMaxSlots('');
    setStatus('Upcoming');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !entryFee || !prizePool || !date || !time || !maxSlots) {
      setErrorMsg("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          gameMode,
          entryFee: Number(entryFee),
          prizePool: Number(prizePool),
          map,
          date,
          time,
          maxSlots: Number(maxSlots)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`Tournament "${name}" created successfully! It is currently unpublished.`);
        setCreateOpen(false);
        resetForm();
        fetchTournaments();
      } else {
        setErrorMsg(data.message || "Failed to create tournament");
      }
    } catch (err) {
      setErrorMsg("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (t: Tournament) => {
    setSelectedTournament(t);
    setName(t.name);
    setGameMode(t.gameMode);
    setEntryFee(t.entryFee.toString());
    setPrizePool(t.prizePool.toString());
    setMap(t.map);
    setDate(t.date);
    setTime(t.time);
    setMaxSlots(t.maxSlots.toString());
    setStatus(t.status);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    setErrorMsg('');
    setSuccessMsg('');

    setSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch(`/api/tournaments/${selectedTournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          gameMode,
          entryFee: Number(entryFee),
          prizePool: Number(prizePool),
          map,
          date,
          time,
          maxSlots: Number(maxSlots),
          status
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`Tournament "${name}" updated successfully!`);
        setEditOpen(false);
        resetForm();
        fetchTournaments();
      } else {
        setErrorMsg(data.message || "Failed to update tournament");
      }
    } catch (err) {
      setErrorMsg("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setTournamentToDelete(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!tournamentToDelete) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch(`/api/tournaments/${tournamentToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccessMsg("Tournament deleted successfully.");
        setDeleteOpen(false);
        setTournamentToDelete(null);
        fetchTournaments();
      } else {
        setErrorMsg("Failed to delete tournament");
      }
    } catch (err) {
      setErrorMsg("Network error.");
    }
  };

  const handleViewTeams = async (tournament: Tournament) => {
    setTeamsTournamentName(tournament.name);
    setTeamsData(null);
    setTeamsOpen(true);
    setTeamsLoading(true);
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTeamsData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch(`/api/tournaments/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccessMsg("Tournament published successfully. Players can now see and join it!");
        fetchTournaments();
      } else {
        setErrorMsg("Failed to publish tournament");
      }
    } catch (err) {
      setErrorMsg("Network error.");
    }
  };

  const columns = [
    { header: "Name", accessor: (row: Tournament) => <span className="font-bold text-white">{row.name}</span> },
    { header: "Mode", accessor: "gameMode" as keyof Tournament },
    { header: "Map", accessor: "map" as keyof Tournament },
    { header: "Entry Fee", accessor: (row: Tournament) => `₹${row.entryFee}` },
    { header: "Prize Pool", accessor: (row: Tournament) => `₹${row.prizePool}` },
    { header: "Slots", accessor: (row: Tournament) => `${row.joinedCount} / ${row.maxSlots}` },
    { header: "Status", accessor: (row: Tournament) => <Badge>{row.status}</Badge> },
    { 
      header: "Visibility", 
      accessor: (row: Tournament) => row.published ? (
        <Badge variant="success">Published</Badge>
      ) : (
        <Badge variant="default">Draft</Badge>
      )
    },
    {
      header: "Actions",
      accessor: (row: Tournament) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewTeams(row)}
            className="p-1.5 hover:bg-slate-800 text-violet-400 hover:text-violet-300 rounded transition"
            title="View Registered Teams"
          >
            <Users size={15} />
          </button>
          {!row.published && (
            <button 
              onClick={() => handlePublish(row.id)}
              className="p-1.5 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 rounded transition"
              title="Publish Tournament"
            >
              <Globe size={15} />
            </button>
          )}
          <button 
            onClick={() => handleEditClick(row)}
            className="p-1.5 hover:bg-slate-800 text-sky-400 hover:text-sky-300 rounded transition"
            title="Edit Details"
          >
            <Edit size={15} />
          </button>
          <button 
            onClick={() => confirmDelete(row.id)}
            className="p-1.5 hover:bg-slate-800 text-red-400 hover:text-red-300 rounded transition"
            title="Delete Tournament"
          >
            <Trash size={15} />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Tournament Manager</h1>
          <p className="text-xs text-textGray font-semibold mt-1">
            Create, delete, update, and publish brackets
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setCreateOpen(true); }} icon={<Plus size={16} />}>
            Create Tournament
          </Button>
          <Button variant="outline" onClick={fetchTournaments} icon={<RefreshCw size={14} />} />
        </div>
      </div>

      {successMsg && <Alert type="success" message={successMsg} />}
      {errorMsg && <Alert type="error" message={errorMsg} />}

      <Card title="Active Tournaments List" subtitle="All draft, active, and completed events">
        <Table columns={columns} data={tournaments} emptyMessage="No tournaments created yet. Create one above." />
      </Card>

      {/* CREATE MODAL */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Tournament">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Tournament Name" placeholder="e.g. FireX Showdown Solo Cup" value={name} onChange={e => setName(e.target.value)} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-textGray mb-2">Game Mode</label>
              <select value={gameMode} onChange={e => setGameMode(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white">
                <option value="Solo">Solo</option>
                <option value="Duo">Duo</option>
                <option value="Squad">Squad</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-textGray mb-2">Map</label>
              <select value={map} onChange={e => setMap(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white">
                <option value="Bermuda">Bermuda</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Entry Fee (INR)" type="number" placeholder="50" value={entryFee} onChange={e => setEntryFee(e.target.value)} />
            <Input label="Prize Pool (INR)" type="number" placeholder="10000" value={prizePool} onChange={e => setPrizePool(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Input label="Time" type="time" value={time} onChange={e => setTime(e.target.value)} />
            <Input label="Max Slots" type="number" placeholder="48" value={maxSlots} onChange={e => setMaxSlots(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-6">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit Details</Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Tournament Details">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label="Tournament Name" value={name} onChange={e => setName(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-textGray mb-2">Game Mode</label>
              <select value={gameMode} onChange={e => setGameMode(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white">
                <option value="Solo">Solo</option>
                <option value="Duo">Duo</option>
                <option value="Squad">Squad</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-textGray mb-2">Map</label>
              <select value={map} onChange={e => setMap(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white">
                <option value="Bermuda">Bermuda</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Entry Fee (INR)" type="number" value={entryFee} onChange={e => setEntryFee(e.target.value)} />
            <Input label="Prize Pool (INR)" type="number" value={prizePool} onChange={e => setPrizePool(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Input label="Time" type="time" value={time} onChange={e => setTime(e.target.value)} />
            <Input label="Max Slots" type="number" value={maxSlots} onChange={e => setMaxSlots(e.target.value)} />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase text-textGray mb-2">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white">
              <option value="Upcoming">Upcoming</option>
              <option value="Live">Live</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-6">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-sm text-textGray leading-relaxed">
            Are you sure you want to delete this tournament? All participant registration brackets and related statistics will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-6">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDelete}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>

      {/* TEAM REGISTRATIONS VIEWER MODAL */}
      <Modal isOpen={teamsOpen} onClose={() => setTeamsOpen(false)} title={`Registered Teams — ${teamsTournamentName}`}>
        <div className="space-y-4">
          {teamsLoading && (
            <div className="py-10 flex justify-center">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {!teamsLoading && teamsData && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-textGray uppercase">Mode: {teamsData.gameMode}</span>
                <span className="text-xs font-bold text-primary">{teamsData.entries.length} {teamsData.gameMode === 'Solo' ? 'Players' : 'Teams'} Registered</span>
              </div>

              {teamsData.entries.length === 0 ? (
                <div className="text-center py-10 text-textGray italic text-xs">
                  No registrations yet for this tournament.
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {teamsData.gameMode === 'Solo' ? (
                    // Solo: simple player list
                    teamsData.entries.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                        <div>
                          <span className="text-xs font-bold text-white block">{p.name}</span>
                          <span className="text-[10px] text-textGray">IGN: {p.ffName}</span>
                        </div>
                        <span className="text-xs font-mono text-textGray">{p.ffUid}</span>
                      </div>
                    ))
                  ) : (
                    // Duo/Squad: team cards
                    teamsData.entries.map((team: any, i: number) => (
                      <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Team {i + 1}</span>
                          <span className="text-[10px] text-textGray">{new Date(team.registeredAt).toLocaleDateString()}</span>
                        </div>

                        {/* Captain */}
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                          <div>
                            <span className="text-[10px] text-orange-400 font-bold uppercase">Captain</span>
                            <p className="text-xs font-bold text-white">{team.captainName}</p>
                            <p className="text-[10px] text-textGray">IGN: {team.captainFfName}</p>
                          </div>
                          <span className="text-xs font-mono text-textGray">{team.captainFfUid || '—'}</span>
                        </div>

                        {/* Teammates */}
                        {team.teammates.map((tm: any, j: number) => (
                          <div key={j} className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-textGray font-bold uppercase">Player {j + 2}</span>
                              <p className="text-xs font-bold text-white">{tm.ffName}</p>
                            </div>
                            <span className="text-xs font-mono text-textGray">{tm.ffUid}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end border-t border-slate-800 pt-4">
            <Button variant="outline" onClick={() => setTeamsOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default TournamentManagement;
