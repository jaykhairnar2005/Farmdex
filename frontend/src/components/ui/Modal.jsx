import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

/**
 * FarmDex Modal
 *
 * Accessible, keyboard-operable dialog:
 *  - ESC closes
 *  - backdrop click closes
 *  - scroll lock while open
 *  - focus moves into panel on open, restored to trigger on close
 *  - aria-modal / role="dialog"
 *
 * Props:
 *  isOpen, onClose, title, subtitle, icon, size, footer, disableCloseOnBackdrop
 */
const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  footer,
  children,
  disableCloseOnBackdrop = false,
  className = '',
}) {
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  // Scroll lock + escape handler
  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKey);

    // Move focus into the panel
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector(
        'input, textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 10);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
      clearTimeout(t);
      // Restore focus to the element that opened the modal
      setTimeout(() => triggerRef.current?.focus?.(), 0);
    };
  }, [isOpen, onClose]);

  const handleBackdrop = useCallback(
    (e) => {
      if (disableCloseOnBackdrop) return;
      if (e.target === e.currentTarget) onClose?.();
    },
    [disableCloseOnBackdrop, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-[2px] fade-in"
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={[
          'relative w-full bg-surface border border-line rounded-2xl shadow-modal',
          'flex flex-col max-h-[90vh] scale-in',
          sizes[size] ?? sizes.md,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {(title || icon) && (
          <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
            <div className="flex items-start gap-3 min-w-0">
              {icon && (
                <span className="w-9 h-9 shrink-0 rounded-lg bg-brand-50 text-brand-800 border border-brand-100 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px]">
                  {icon}
                </span>
              )}
              <div className="min-w-0">
                {title && <h2 className="text-base font-semibold text-ink truncate">{title}</h2>}
                {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 shrink-0"
            >
              <X className="w-4 h-4" />
            </IconButton>
          </header>
        )}

        <div className="px-5 py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-3 px-5 py-4 border-t border-line bg-surface-muted/40">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation dialog for destructive / important actions.
 * Replaces window.confirm() with an accessible, on-brand dialog.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg border border-line bg-surface text-ink hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              'inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg text-white border border-transparent transition-colors cursor-pointer disabled:opacity-40',
              tone === 'danger' ? 'bg-danger hover:bg-red-700' : 'bg-brand-800 hover:bg-brand-900',
            ].join(' ')}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
    </Modal>
  );
}
