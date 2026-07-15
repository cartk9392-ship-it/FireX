import React, { useEffect, useState } from 'react';
import { Plus, Edit, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

interface Match {
  id: string;
  tournamentId: string;
  tournamentName: string;
  roomId: string;
  roomPasswordHash: string;
  startTime: string;
  map: string;
  status: 'Upcoming' | 'Live' | 'Completed';
  resultsUploaded: boolean;
}

interface Tournament {
  id: string;
  name: string;
  map: string;
  status: string;
}

export const MatchManagement: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Form Fields
  const [tournamentId, setTournamentId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [startTime, setStartTime] = useState('');
  const [map, setMap] = useState('Bermuda');
  const [matchStatus, setMatchStatus] = useState<'Upcoming' | 'Live' | 'Completed'>('Upcoming');

  const [submitting, setSubmitting] = useState(false);

  const fetchMatchesAndTournaments = async () => {
    try {
      const token = localStorage.getItem('firex_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const mResponse = await fetch('/api/matches', { headers });
      const mData = await mResponse.json();

      const tResponse = await fetch('/api/tournaments', { headers });
      const tData = await tResponse.json();

      if (Array.isArray(mData)) setMatches(mData);
      if (Array.isArray(tData)) {
        // Only allow creating matches for Active/Upcoming tournaments
        setTournaments(tData.filter(t => t.status !== 'Completed'));
        if (tData.length > 0) setTournamentId(tData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesAndTournaments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!tournamentId || !roomId || !roomPassword || !startTime || !map) {
      setErrorMsg("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tournamentId,
          roomId,
          roomPassword,
          startTime,
          map
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg("Match room created successfully! Registered players notified.");
        setCreateOpen(false);
        // Reset form
        setRoomId('');
        setRoomPassword('');
        setStartTime('');
        fetchMatchesAndTournaments();
      } else {
        setErrorMsg(data.message || "Failed to create match");
      }
    } catch (err) {
      setErrorMsg("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusClick = (m: Match) => {
    setSelectedMatch(m);
    setMatchStatus(m.status);
    setRoomId(m.roomId);
    setRoomPassword(m.roomPasswordHash);
    setStartTime(m.startTime.substring(0, 16)); // format date
    setMap(m.map);
    setStatusOpen(true);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setErrorMsg('');
    setSuccessMsg('');

    setSubmitting(true);
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: matchStatus,
          roomId,
          roomPassword,
          startTime,
          map
        })
      });

      if (response.ok) {
        setSuccessMsg("Match status and credentials updated successfully!");
        setStatusOpen(false);
        fetchMatchesAndTournaments();
      } else {
        setErrorMsg("Failed to update match");
      }
    } catch (err) {
      setErrorMsg("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: "Tournament", accessor: "tournamentName" as keyof Match },
    { header: "Match ID", accessor: "id" as keyof Match },
    { 
      header: "Room Details", 
      accessor: (row: Match) => (
        <span className="font-mono text-xs text-textGray">
          ID: <strong className="text-white">{row.roomId}</strong> | PW: <strong className="text-white">{row.roomPasswordHash}</strong>
        </span>
      )
    },
    { header: "Map", accessor: "map" as keyof Match },
    { header: "Scheduled Start", accessor: (row: Match) => new Date(row.startTime).toLocaleString() },
    { header: "Status", accessor: (row: Match) => <Badge>{row.status}</Badge> },
    {
      header: "Actions",
      accessor: (row: Match) => (
        <div className="flex gap-2">
          {row.status !== 'Completed' && (
            <button 
              onClick={() => handleStatusClick(row)}
              className="p-1.5 hover:bg-slate-800 text-primary hover:text-orange-400 rounded transition"
              title="Edit Match Details / Start Match"
            >
              <Edit size={15} />
            </button>
          )}
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
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Match Lobbies Manager</h1>
          <p className="text-xs text-textGray font-semibold mt-1">
            Build custom match instances, distribute Room links, and transition statuses
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
            Create Match Room
          </Button>
          <Button variant="outline" onClick={fetchMatchesAndTournaments} icon={<RefreshCw size={14} />} />
        </div>
      </div>

      {successMsg && <Alert type="success" message={successMsg} />}
      {errorMsg && <Alert type="error" message={errorMsg} />}

      <Card title="Active Match Brackets" subtitle="Lobbies that players are participating in">
        <Table columns={columns} data={matches} emptyMessage="No matches created yet. Create a match lobby above." />
      </Card>

      {/* CREATE MODAL */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Match Room">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase text-textGray mb-2">Target Tournament</label>
            <select 
              value={tournamentId} 
              onChange={e => {
                setTournamentId(e.target.value);
                const selected = tournaments.find(t => t.id === e.target.value);
                if (selected) setMap(selected.map);
              }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:border-primary outline-none"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Room ID" placeholder="e.g. 778899" value={roomId} onChange={e => setRoomId(e.target.value)} />
            <Input label="Room Password" placeholder="e.g. firex99" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date & Time" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-textGray mb-2">Map</label>
              <select value={map} onChange={e => setMap(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white outline-none">
                <option value="Bermuda">Bermuda</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-6">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit Room Details</Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE STATUS / CREDENTIALS MODAL */}
      <Modal isOpen={statusOpen} onClose={() => setStatusOpen(false)} title="Update Match Details">
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
            <Input label="Room Password" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date & Time" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase text-textGray mb-2">Map</label>
              <select value={map} onChange={e => setMap(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white outline-none">
                <option value="Bermuda">Bermuda</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase text-textGray mb-2">Match Status</label>
            <select value={matchStatus} onChange={e => setMatchStatus(e.target.value as any)} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white outline-none">
              <option value="Upcoming">Upcoming</option>
              <option value="Live">Live (Start Match)</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-6">
            <Button type="button" variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Update Lobby</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default MatchManagement;
