import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-textWhite">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-premium text-center space-y-6 animate-fade-in">
        
        {/* Glow Emblem */}
        <div className="w-20 h-20 rounded-2xl orange-gradient-bg flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/20 animate-pulse-subtle">
          <ShieldAlert size={42} />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-white select-none">404</h1>
          <h2 className="text-lg font-black uppercase text-primary tracking-wide">Zone Out of Bounds</h2>
          <p className="text-xs text-textGray font-semibold leading-relaxed">
            The page bracket you are looking for has been caught in the shrink zone or removed from the match lobby. 
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-3">
          <Link to="/" className="w-full">
            <Button className="w-full justify-center" icon={<ArrowLeft size={16} />}>
              Back to Safe Zone
            </Button>
          </Link>
          <Link to="/login" className="w-full text-xs text-textGray hover:text-white font-bold transition">
            Login to Player Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
