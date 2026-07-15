import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, User, Swords, Shield, Wallet, Bell, Settings, LogOut,
  Trophy, Users, CreditCard, Award, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  role: 'player' | 'admin';
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, mobileOpen, setMobileOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Nav items based on role
  const playerItems = [
    { label: 'Dashboard', path: '/player/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Profile', path: '/player/profile', icon: <User size={18} /> },
    { label: 'Join Tournament', path: '/player/join', icon: <Trophy size={18} /> },
    { label: 'My Tournaments', path: '/player/my-tournaments', icon: <Shield size={18} /> },
    { label: 'Wallet', path: '/player/wallet', icon: <Wallet size={18} /> },
    { label: 'Notifications', path: '/player/notifications', icon: <Bell size={18} /> },
    { label: 'Settings', path: '/player/settings', icon: <Settings size={18} /> }
  ];

  const adminItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Tournaments', path: '/admin/tournaments', icon: <Trophy size={18} /> },
    { label: 'Matches', path: '/admin/matches', icon: <Swords size={18} /> },
    { label: 'Players', path: '/admin/players', icon: <Users size={18} /> },
    { label: 'Wallet Manager', path: '/admin/wallet', icon: <CreditCard size={18} /> },
    { label: 'Prize Allocator', path: '/admin/prizes', icon: <Award size={18} /> },
    { label: 'Broadcasts', path: '/admin/notifications', icon: <Bell size={18} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> }
  ];

  const items = role === 'admin' ? adminItems : playerItems;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      <div className="flex items-center justify-between px-6 py-5.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-slate-950 border border-slate-800 shrink-0">
            <img src="/icon-192.png" alt="FireX" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-black uppercase tracking-tight text-white">
            Fire<span className="text-primary text-glow-orange">X</span> <span className="text-[10px] bg-slate-800 text-textGray px-1.5 py-0.5 rounded ml-1 font-bold tracking-widest">{role.toUpperCase()}</span>
          </span>
        </div>
        <button 
          onClick={() => setMobileOpen(false)} 
          className="md:hidden text-textGray hover:text-white p-1 hover:bg-slate-800 rounded transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Profile summary inside sidebar */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-900/40">
        <p className="text-[10px] font-bold text-textGray uppercase tracking-wider">Logged In As</p>
        <h4 className="text-sm font-bold text-white mt-1 truncate">{user?.name || "Loading..."}</h4>
        {role === 'player' && (
          <div className="flex items-center justify-between mt-2.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-xs text-textGray font-semibold">Wallet Balance</span>
            <span className="text-xs font-bold text-primary">{user?.walletBalance} INR</span>
          </div>
        )}
      </div>

      {/* Scrollable Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 ${
                isActive 
                  ? 'orange-gradient-bg text-white shadow-lg shadow-orange-500/10' 
                  : 'text-textGray hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 w-full px-4 py-3 rounded-lg text-sm font-semibold tracking-wide text-red-400 hover:text-white hover:bg-red-950/20 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Left Fixed) */}
      <aside className="hidden md:block fixed top-0 left-0 h-screen w-64 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-in */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar Panel */}
          <div className="relative w-64 max-w-xs flex flex-col h-full z-10 animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
export default Sidebar;
