import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Wallet, Calendar, ChevronRight, Swords, User, Settings 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loader from '../components/Loader';

interface Tournament {
  id: string;
  name: string;
  gameMode: string;
  entryFee: number;
  prizePool: number;
  map: string;
  date: string;
  time: string;
  status: string;
  published: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface Match {
  id: string;
  tournamentName: string;
  roomId: string;
  roomPasswordHash: string;
  startTime: string;
  map: string;
  status: string;
}

export const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playerMatches, setPlayerMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('firex_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch tournaments
        const tRes = await fetch('/api/tournaments', { headers });
        const tData = await tRes.json();
        
        // Fetch player-specific matches
        const mRes = await fetch('/api/matches/player-matches', { headers });
        const mData = await mRes.json();

        // Fetch notifications
        const nRes = await fetch('/api/settings/notifications', { headers });
        const nData = await nRes.json();

        if (Array.isArray(tData)) setTournaments(tData);
        if (Array.isArray(mData)) setPlayerMatches(mData);
        if (Array.isArray(nData)) setNotifications(nData.slice(0, 4)); // show top 4
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const upcomingTournaments = tournaments.filter(t => t.status === 'Upcoming' && t.published);
  const liveMatches = playerMatches.filter(m => m.status === 'Live');

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Welcome Row */}
      <div className="orange-gradient-bg p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-premium">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-orange-200">Welcome Back Champion</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold uppercase mt-1 tracking-tight text-white">
            Hello, {user?.name}!
          </h1>
          <p className="text-sm font-semibold text-orange-100 mt-2 max-w-xl">
            You have joined matches scheduled for today. Make sure to check your room credentials below.
          </p>
        </div>
        <Link to="/player/join">
          <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold px-6 py-3">
            Find Tournaments
          </Button>
        </Link>
      </div>

      {/* Grid of Key ERP metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center">
            <Wallet size={22} />
          </div>
          <div>
            <span className="text-xs text-textGray uppercase font-bold tracking-wider">Wallet Balance</span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">₹{user?.walletBalance} INR</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center">
            <Trophy size={22} />
          </div>
          <div>
            <span className="text-xs text-textGray uppercase font-bold tracking-wider">Live & Active Battles</span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{liveMatches.length} Match</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-xs text-textGray uppercase font-bold tracking-wider">Upcoming Events</span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{upcomingTournaments.length} Open</h3>
          </div>
        </Card>
      </div>

      {/* Body grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2-column details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active / Registered matches */}
          <Card title="Your Active Matches" subtitle="Room IDs and passwords are listed here when available">
            {playerMatches.length === 0 ? (
              <div className="text-center py-8 text-textGray text-xs italic">
                You haven't joined any match lobby yet. Go register for a tournament!
              </div>
            ) : (
              <div className="space-y-4">
                {playerMatches.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>{m.status}</Badge>
                        <span className="text-[10px] text-textGray uppercase font-bold">{m.map}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{m.tournamentName}</h4>
                      <p className="text-xs text-textGray mt-1">Starts: {new Date(m.startTime).toLocaleString()}</p>
                    </div>

                    <div className="px-4 py-2 bg-slate-950 border border-slate-800/80 rounded-lg text-xs">
                      {m.status === 'Live' || m.status === 'Upcoming' ? (
                        <div className="space-y-1">
                          <div><span className="text-textGray font-semibold">Room ID:</span> <span className="font-mono font-extrabold text-primary select-all">{m.roomId}</span></div>
                          <div><span className="text-textGray font-semibold">Password:</span> <span className="font-mono font-extrabold text-white select-all">{m.roomPasswordHash}</span></div>
                        </div>
                      ) : (
                        <span className="text-textGray italic">Room terminated</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming tournaments */}
          <Card 
            title="Available Tournaments" 
            subtitle="Register before slots fill up"
            extra={
              <Link to="/player/join" className="text-xs font-bold text-primary hover:underline flex items-center">
                View All <ChevronRight size={14} />
              </Link>
            }
          >
            {upcomingTournaments.length === 0 ? (
              <div className="text-center py-8 text-textGray text-xs italic">
                No upcoming tournaments scheduled at this moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingTournaments.slice(0, 2).map((t) => (
                  <div key={t.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between h-full">
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{t.name}</h4>
                      <p className="text-[10px] text-textGray mb-3">Map: {t.map} | {t.gameMode}</p>
                      
                      <div className="flex gap-4 text-xs mb-4">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-textGray">Prize Pool</span>
                          <span className="font-extrabold text-primary">₹{t.prizePool}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-textGray">Entry Fee</span>
                          <span className="font-extrabold text-white">₹{t.entryFee}</span>
                        </div>
                      </div>
                    </div>
                    <Link to="/player/join">
                      <Button size="sm" className="w-full">Register</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar right: Notifications & Actions */}
        <div className="space-y-6">
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/player/join" className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-primary/30 transition text-center flex flex-col items-center gap-2">
                <Swords size={20} className="text-primary" />
                <span className="text-xs font-bold text-white">Join Event</span>
              </Link>
              <Link to="/player/wallet" className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-primary/30 transition text-center flex flex-col items-center gap-2">
                <Wallet size={20} className="text-emerald-400" />
                <span className="text-xs font-bold text-white">Top Up</span>
              </Link>
              <Link to="/player/profile" className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-primary/30 transition text-center flex flex-col items-center gap-2">
                <User size={20} className="text-sky-400" />
                <span className="text-xs font-bold text-white">My Profile</span>
              </Link>
              <Link to="/player/settings" className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-primary/30 transition text-center flex flex-col items-center gap-2">
                <Settings size={20} className="text-slate-400" />
                <span className="text-xs font-bold text-white">Settings</span>
              </Link>
            </div>
          </Card>

          <Card 
            title="Recent Activity"
            extra={
              <Link to="/player/notifications" className="text-[10px] font-bold text-textGray hover:text-white">
                Clear
              </Link>
            }
          >
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-textGray text-xs italic">
                No recent activity reports.
              </div>
            ) : (
              <div className="space-y-3.5">
                {notifications.map((n) => (
                  <div key={n.id} className="text-xs border-l-2 border-primary/50 pl-3.5 py-1">
                    <h5 className="font-bold text-white">{n.title}</h5>
                    <p className="text-textGray mt-0.5 text-[11px] leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">{new Date(n.date).toLocaleDateString()}</span>
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
export default PlayerDashboard;
