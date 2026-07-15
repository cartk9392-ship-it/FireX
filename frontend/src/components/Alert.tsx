import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  message,
  children,
  onClose,
  className = ''
}) => {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-400'
  };

  const icons = {
    success: <CheckCircle size={18} className="shrink-0 mt-0.5" />,
    warning: <AlertCircle size={18} className="shrink-0 mt-0.5" />,
    error: <XCircle size={18} className="shrink-0 mt-0.5" />,
    info: <Info size={18} className="shrink-0 mt-0.5" />
  };

  return (
    <div className={`flex items-start justify-between gap-3 border p-4 rounded-xl text-sm ${styles[type]} ${className}`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="font-medium">{children || message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-textGray hover:text-white p-0.5 rounded transition shrink-0"
          title="Dismiss Alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Alert;
