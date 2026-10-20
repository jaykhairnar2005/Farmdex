import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * FarmDex Toast notification system
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success('Saved!');
 *   toast.error('Something went wrong.');
 *   toast.info('Note: prices are per quintal.');
 *
 * Wrap your app (or AppLayout) with <ToastProvider>.
 */

const ToastContext = createContext(null);
let _counter = 0;

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const remove = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);

  const show = useCallback(
    ({ message, type = 'info', duration = 4000 }) => {
      const id = ++_counter;
      dispatch({ type: 'ADD', toast: { id, message, type } });
      if (duration > 0) setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const toast = {
    success: (msg, opts) => show({ message: msg, type: 'success', ...opts }),
    error:   (msg, opts) => show({ message: msg, type: 'error',   ...opts }),
    info:    (msg, opts) => show({ message: msg, type: 'info',    ...opts }),
    warn:    (msg, opts) => show({ message: msg, type: 'warning', ...opts }),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-success" />,
  error:   <AlertCircle  className="w-4 h-4 text-danger"  />,
  warning: <AlertCircle  className="w-4 h-4 text-warning" />,
  info:    <Info         className="w-4 h-4 text-info"    />,
};

const styles = {
  success: 'border-success-edge bg-success-soft text-success',
  error:   'border-danger-edge  bg-danger-soft  text-danger',
  warning: 'border-warning-edge bg-warning-soft text-warning',
  info:    'border-info-edge    bg-info-soft    text-info',
};

function ToastRegion({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="assertive"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-sm w-full"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={[
            'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-popover slide-up',
            styles[t.type] ?? styles.info,
          ].join(' ')}
        >
          <span className="shrink-0 mt-0.5">{icons[t.type]}</span>
          <p className="flex-1 leading-snug">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
