import React from 'react';
import { Package, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button, ButtonLink } from './Button';

/**
 * FarmDex Empty / Error / Loading states
 * Consistent across every page.
 */

/** SkeletonBlock — a single shimmer block. */
export function SkeletonBlock({ className = '' }) {
  return <div className={['skeleton', className].filter(Boolean).join(' ')} />;
}

/** SkeletonCard — a pre-shaped card-sized skeleton for product grids. */
export function SkeletonCard() {
  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-card">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="p-4 space-y-2.5">
        <SkeletonBlock className="h-4 w-3/5 rounded" />
        <SkeletonBlock className="h-3 w-2/5 rounded" />
        <div className="flex justify-between pt-2">
          <SkeletonBlock className="h-5 w-20 rounded" />
          <SkeletonBlock className="h-5 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

/** SkeletonTable — placeholder table rows. */
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-0 divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <SkeletonBlock className="w-9 h-9 rounded-lg shrink-0" />
          {Array.from({ length: cols - 1 }).map((__, j) => (
            <SkeletonBlock key={j} className="h-3.5 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** EmptyState — used when a list/query returns no results. */
export function EmptyState({ icon, title, message, action, className = '' }) {
  const Icon = icon;
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center px-8 py-16 bg-surface border border-line rounded-xl max-w-sm mx-auto',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="w-12 h-12 rounded-xl bg-surface-muted text-ink-subtle flex items-center justify-center mb-4">
        {Icon ? <Icon className="w-6 h-6" /> : <Package className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      {message && <p className="text-xs text-ink-muted leading-relaxed max-w-xs mb-4">{message}</p>}
      {action && (
        action.to ? (
          <ButtonLink to={action.to} size="sm" icon={action.icon}>{action.label}</ButtonLink>
        ) : (
          <Button size="sm" onClick={action.onClick} icon={action.icon}>{action.label}</Button>
        )
      )}
    </div>
  );
}

/** ErrorState — inline error message with optional retry. */
export function ErrorState({ message, onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={[
        'flex flex-col items-center gap-3 text-center px-8 py-12 bg-danger-soft border border-danger-edge rounded-xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <AlertCircle className="w-6 h-6 text-danger" />
      <p className="text-sm text-danger font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-danger underline underline-offset-2 cursor-pointer hover:no-underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** PageSpinner — full-page or section loading indicator. */
export function PageSpinner({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-muted">
      <span className="w-8 h-8 border-2 border-brand-800 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

/** InlineAlert — compact inline success/error/info/warning banner. */
const alertStyles = {
  success: 'bg-success-soft border-success-edge text-success',
  error:   'bg-danger-soft  border-danger-edge  text-danger',
  warning: 'bg-warning-soft border-warning-edge text-warning',
  info:    'bg-info-soft    border-info-edge    text-info',
};
const alertIcons = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  error:   <AlertCircle  className="w-4 h-4 shrink-0" />,
  warning: <AlertCircle  className="w-4 h-4 shrink-0" />,
  info:    null,
};

export function InlineAlert({ type = 'info', message, onDismiss, className = '' }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={[
        'flex items-center gap-3 px-4 py-3 text-sm border rounded-lg',
        alertStyles[type] ?? alertStyles.info,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {alertIcons[type]}
      <span className="flex-1 leading-snug">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
