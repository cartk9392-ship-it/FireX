import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/player/dashboard');
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-center bg-slate-950 shrink-0">
              <img src="/icon-192.png" alt="FireX" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-black uppercase tracking-tight text-white">
              Fire<span className="text-primary text-glow-orange">X</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-semibold text-textGray hover:text-white transition">Home</Link>
            <Link to="/#tournaments" className="text-sm font-semibold text-textGray hover:text-white transition">Tournaments</Link>
            <Link to="/#features" className="text-sm font-semibold text-textGray hover:text-white transition">Features</Link>
            <Link to="/#faq" className="text-sm font-semibold text-textGray hover:text-white transition">FAQ</Link>
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleDashboardRedirect} icon={<User size={15} />}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={logout} icon={<LogOut size={15} />}>
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-textGray hover:text-white p-2 rounded-lg transition focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-4 pb-6 space-y-4">
          <Link 
            to="/" 
            onClick={() => setIsOpen(false)}
            className="block text-base font-semibold text-textGray hover:text-white transition"
          >
            Home
          </Link>
          <a 
            href="#tournaments" 
            onClick={() => setIsOpen(false)}
            className="block text-base font-semibold text-textGray hover:text-white transition"
          >
            Tournaments
          </a>
          <a 
            href="#features" 
            onClick={() => setIsOpen(false)}
            className="block text-base font-semibold text-textGray hover:text-white transition"
          >
            Features
          </a>
          <a 
            href="#faq" 
            onClick={() => setIsOpen(false)}
            className="block text-base font-semibold text-textGray hover:text-white transition"
          >
            FAQ
          </a>

          <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
            {user ? (
              <>
                <Button className="w-full" onClick={() => { handleDashboardRedirect(); setIsOpen(false); }}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { logout(); setIsOpen(false); }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">Register Player</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
