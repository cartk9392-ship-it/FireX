import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  extra,
  children,
  className = '',
  hoverGlow = false
}) => {
  return (
    <div className={`bg-cardBg rounded-xl border border-slate-800 p-5 shadow-soft transition-all duration-300 ${hoverGlow ? 'hover:shadow-premium hover:border-orange-500/30' : ''} ${className}`}>
      {(title || subtitle || extra) && (
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            {title && <h3 className="text-lg font-bold text-textWhite">{title}</h3>}
            {subtitle && <p className="text-xs text-textGray mt-0.5">{subtitle}</p>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
export default Card;
