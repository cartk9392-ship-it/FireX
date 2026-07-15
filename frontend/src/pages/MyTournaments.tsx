import React, { useEffect, useState } from 'react';
import { Shield, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import Table from '../components/Table';

interface JoinedTournament {
  id: string;
  name: string;
  gameMode: string;
  entryFee: number;
  prizePool: number;
  map: string;
  date: string;
  time: string;
  status: string;
}

interface MatchResult {
  matchId: string;
  tournamentName: string;
  rank: number;
  kills: number;
  points: number;
  prize: number;
}

export const MyTournaments: React.FC = () => {
  const { user } = useAuth();
  const [joined, setJoined] = useState<JoinedTournament[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('firex_token');
        const response = await fetch(`/api/players/${user?.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data) {
          if (Array.isArray(data.tournaments)) {
            setJoined(data.tournaments);
          }
          if (Array.isArray(data.matchResults)) {
            setResults(data.matchResults);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const columns = [
    { header: "Tournament", accessor: (row: MatchResult) => row.tournamentName },
    { header: "Match ID", accessor: "matchId" as keyof MatchResult },
    { header: "Rank", accessor: (row: MatchResult) => <span className="font-extrabold text-white"># {row.rank}</span> },
    { header: "Kills", accessor: "kills" as keyof MatchResult },
    { header: "Total Points", accessor: "points" as keyof MatchResult },
    { 
      header: "Prize Awarded", 
      accessor: (row: MatchResult) => row.prize > 0 ? (
        <span className="text-emerald-400 font-bold">₹{row.prize} INR</span>
      ) : (
        <span className="text-textGray">-</span>
      ) 
    }
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">My Tournaments</h1>
        <p className="text-xs text-textGray font-semibold mt-1">
          Review your bracket registrations and performance stats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled brackets */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Registered Brackets" subtitle="Lobbies you have joined and are active or completed">
            {joined.length === 0 ? (
              <div className="text-center py-12 text-textGray text-xs italic">
                <Shield size={36} className="mx-auto mb-3 opacity-25" />
                You are not registered in any tournament bracket.
              </div>
            ) : (
              <div className="space-y-4">
                {joined.map((t) => (
                  <div key={t.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge>{t.status}</Badge>
                        <span className="text-[10px] text-textGray uppercase font-bold">{t.gameMode}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{t.name}</h4>
                      <p className="text-xs text-textGray mt-0.5">
                        Map: {t.map} | Start: {t.date} at {t.time}
                      </p>
                    </div>

                    <div className="flex gap-6 items-center text-xs">
                      <div className="text-right">
                        <span className="block text-[9px] uppercase font-bold text-textGray">Prize Pool</span>
                        <span className="font-extrabold text-primary">₹{t.prizePool}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] uppercase font-bold text-textGray">Entry Fee Paid</span>
                        <span className="font-semibold text-white">₹{t.entryFee}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right side: Performance Leaderboard history */}
        <div>
          <Card title="Performance History" subtitle="Your placement rankings and kill payouts">
            {results.length === 0 ? (
              <div className="text-center py-12 text-textGray text-xs italic">
                <Trophy size={36} className="mx-auto mb-3 opacity-25" />
                No placements recorded yet. Work hard and earn prizes!
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((res, index) => (
                  <div key={index} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-white text-xs truncate max-w-[150px]">{res.tournamentName}</h5>
                      <span className="text-[10px] text-textGray block mt-0.5">{res.kills} Kills | {res.points} Points</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black block text-primary">Rank #{res.rank}</span>
                      {res.prize > 0 && <span className="text-[11px] font-bold text-emerald-400">+ ₹{res.prize}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {results.length > 0 && (
        <Card title="Detailed Placements Logs">
          <Table columns={columns} data={results} />
        </Card>
      )}
    </div>
  );
};
export default MyTournaments;
