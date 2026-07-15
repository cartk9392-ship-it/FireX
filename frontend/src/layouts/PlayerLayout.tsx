import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Menu, RefreshCw } from 'lucide-react';
import Loader from '../components/Loader';

export const PlayerLayout: React.FC = () => {
  const { user, loading, refreshProfile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (loading) {
    return <Loader fullPage />;
  }

  // Guard routing
  if (!user || user.role !== 'player') {
    return <Navigate to="/login" replace />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background text-textWhite">
      {/* Navigation Sidebar */}
      <Sidebar role="player" mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Panel Content Area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar inside Panel */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800/80 backdrop-blur-md">
          {/* Left: Mobile hamburger menu & screen title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-textGray hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-textGray uppercase tracking-wider">Workspace</span>
              <h2 className="text-sm font-bold text-white leading-tight">Player Portal</h2>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-4">
            {/* Sync profile details */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg text-textGray hover:text-white hover:bg-slate-800 transition ${refreshing ? 'animate-spin text-primary' : ''}`}
              title="Refresh Wallet Balance"
            >
              <RefreshCw size={17} />
            </button>

            {/* Quick Profile Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full shadow-inner">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-700/50 flex items-center justify-center bg-slate-900 shrink-0 shadow-md">
                <img src="/icon-192.png" alt="Mascot Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-black tracking-wide text-white pr-2">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default PlayerLayout;
