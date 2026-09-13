import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ModalProps } from './Modal.types';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = true,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  }[size];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={closeOnBackdrop ? onClose : undefined}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${sizeClasses} overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 transition-all z-10 flex flex-col max-h-[90vh] ${className}`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-slate-100">
            <div>
              {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
              {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-4"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar-light text-slate-700 text-sm flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50/70">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
