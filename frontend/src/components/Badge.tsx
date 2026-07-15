import React from 'react';

interface BadgeProps {
  children: string;
  variant?: 'success' | 'warning' | 'info' | 'error' | 'default' | 'primary' | 'danger' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default'
}) => {
  const baseStyle = "px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider inline-block";
  
  const variants = {
    default: "bg-slate-800 text-slate-300",
    neutral: "bg-slate-800 text-slate-300",
    primary: "bg-orange-500/10 text-primary border border-orange-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    info: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    error: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  };

  const getVariant = (val: string): keyof typeof variants => {
    const norm = val.toLowerCase().trim();
    if (['live', 'active', 'approved', 'deposit', 'prize'].includes(norm)) return 'success';
    if (['upcoming', 'pending'].includes(norm)) return 'warning';
    if (['completed', 'published'].includes(norm)) return 'info';
    if (['cancelled', 'banned', 'rejected', 'withdrawal', 'error'].includes(norm)) return 'error';
    return variant;
  };

  return (
    <span className={`${baseStyle} ${variants[getVariant(children)]}`}>
      {children}
    </span>
  );
};
export default Badge;
