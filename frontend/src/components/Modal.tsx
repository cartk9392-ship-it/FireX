import React from 'react';
import { X } from 'lucide-react';


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className={`relative w-full ${sizeClasses[size]} rounded-2xl bg-cardBg border border-slate-800 shadow-2xl p-6 text-left transform transition-all`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4.5 mb-5">
            <h3 className="text-lg font-bold text-textWhite">{title}</h3>
            <button 
              onClick={onClose} 
              className="text-textGray hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="text-sm text-textWhite max-h-[70vh] overflow-y-auto pr-1">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Modal;
