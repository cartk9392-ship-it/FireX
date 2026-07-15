import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col mb-4.5">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-textGray mb-2">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-textGray pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-slate-900 border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-800 focus:ring-primary/20 focus:border-primary'} ${icon ? 'pl-11' : 'pl-4'} pr-4 py-3 rounded-lg text-sm text-textWhite placeholder-slate-500 outline-none focus:ring-4 transition-all duration-150 ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 mt-1.5 font-medium">{error}</span>}
    </div>
  );
};
export default Input;
