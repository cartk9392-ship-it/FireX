import React from 'react';

interface LoaderProps {
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({
  fullPage = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div className="relative flex flex-col items-center gap-4">
      <div 
        className={`${sizeClasses[size]} border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin`}
      />
      <div 
        className={`absolute ${sizeClasses[size]} border-slate-800 rounded-full`}
        style={{ zIndex: -1 }}
      />
      {size === 'lg' && (
        <span className="text-xs uppercase tracking-widest text-textGray font-bold animate-pulse">
          Loading FireX...
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6">
      {spinner}
    </div>
  );
};
export default Loader;
