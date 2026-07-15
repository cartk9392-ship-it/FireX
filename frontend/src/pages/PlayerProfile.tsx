import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

interface ProfileData {
  player: {
    id: string;
    name: string;
    email: string;
    isBanned: boolean;
    walletBalance: number;
    inGameName?: string;
    inGameUid?: string;
  };
  tournaments: any[];
  matchResults: any[];
}

export const PlayerProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Credentials state
  const [editOpen, setEditOpen] = useState(false);
  const [ign, setIgn] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('firex_token');
        const response = await fetch(`/api/players/${user?.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setProfile(data);
        setIgn(data.player.inGameName || '');
        setFfUid(data.player.inGameUid || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id]);

  if (loading) {
    return <Loader />;
  }

  if (!profile) {
    return <div className="text-center py-12 text-textGray">Failed to load profile.</div>;
  }

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch(`/api/players/${user?.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ inGameName: ign, inGameUid: ffUid })
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(prev => prev ? {
          ...prev,
          player: {
            ...prev.player,
            inGameName: ign,
            inGameUid: ffUid
          }
        } : null);
        setEditOpen(false);
      } else {
        setUpdateMsg({ type: 'error', text: data.message || "Failed to update profile." });
      }
    } catch (err) {
      setUpdateMsg({ type: 'error', text: "Network connection failure." });
    } finally {
      setSubmitting(false);
    }
  };

  const totalKills = profile.matchResults.reduce((sum, res) => sum + res.kills, 0);
  const totalPrize = profile.matchResults.reduce((sum, res) => sum + res.prize, 0);

  return (
    <div className="space-y-6">
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Update FF Credentials">
        <form onSubmit={handleUpdateCredentials} className="space-y-4">
          <Input label="In-Game Name (IGN)" value={ign} onChange={(e) => setIgn(e.target.value)} required />
          <Input label="Free Fire UID" value={ffUid} onChange={(e) => setFfUid(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Updating...' : 'Save Changes'}
          </Button>
        </form>
      </Modal>

      {updateMsg && <Alert type={updateMsg.type} onClose={() => setUpdateMsg(null)}>{updateMsg.text}</Alert>}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Player Profile</h1>
        <p className="text-xs text-textGray font-semibold mt-1">
          Personal record details and statistics summary
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Main User Card */}
          <Card className="text-center p-6">
            <div className="w-20 h-20 rounded-full orange-gradient-bg flex items-center justify-center text-2xl font-black text-white mx-auto mb-4 border-4 border-slate-800 shadow-lg">
              {profile.player.name.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">{profile.player.name}</h3>
            <p className="text-xs text-textGray mt-1 truncate">{profile.player.email}</p>
            
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold text-emerald-400 uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Active Player
            </div>
          </Card>

          {/* Account Particulars */}
          <Card title="Details">
            <div className="space-y-4 text-xs font-semibold text-textGray">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span>Account UID:</span>
                <span className="text-white font-mono">{profile.player.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span>E-Mail:</span>
                <span className="text-white">{profile.player.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span>Free Fire IGN:</span>
                <span className="text-white font-mono">{profile.player.inGameName || <span className="text-amber-500 font-bold italic">Not set</span>}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span>Free Fire UID:</span>
                <span className="text-white font-mono">{profile.player.inGameUid || <span className="text-amber-500 font-bold italic">Not set</span>}</span>
              </div>
              <div className="flex justify-between py-2 mb-2">
                <span>Wallet Balance:</span>
                <span className="text-primary font-bold">₹{profile.player.walletBalance} INR</span>
              </div>
              <Button type="button" size="xs" variant="outline" className="w-full mt-2" onClick={() => setEditOpen(true)}>
                Edit FF Credentials
              </Button>
            </div>
          </Card>
        </div>

        {/* Dynamic statistics summary */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Career Metrics">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl">
                <h4 className="text-2xl font-extrabold text-primary">{profile.tournaments.length}</h4>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider mt-1 block">Brackets Joined</span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl">
                <h4 className="text-2xl font-extrabold text-white">{profile.matchResults.length}</h4>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider mt-1 block">Matches Played</span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl">
                <h4 className="text-2xl font-extrabold text-white">{totalKills}</h4>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider mt-1 block">Total Kills</span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl">
                <h4 className="text-2xl font-extrabold text-emerald-400">₹{totalPrize}</h4>
                <span className="text-[10px] text-textGray uppercase font-bold tracking-wider mt-1 block">Cash Earned</span>
              </div>
            </div>
          </Card>

          <Card title="Match Performance Log" subtitle="History of rankings across games">
            {profile.matchResults.length === 0 ? (
              <div className="text-center py-10 text-textGray italic text-xs">
                No matches registered. Participate in your first event to build your statistics report!
              </div>
            ) : (
              <div className="space-y-3">
                {profile.matchResults.map((r, idx) => (
                  <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <div>
                      <h4 className="font-bold text-white text-sm">{r.tournamentName}</h4>
                      <p className="text-textGray mt-0.5">Kills: {r.kills} | Points: {r.points}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-primary text-sm block">Rank #{r.rank}</span>
                      {r.prize > 0 && <span className="text-emerald-400 text-[10px]">+ ₹{r.prize}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
export default PlayerProfile;
