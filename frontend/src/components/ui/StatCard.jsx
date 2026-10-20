import React from 'react';

/**
 * FarmDex StatCard
 * Compact, honest metric card. No fabricated trends.
 *
 * Props: label, value, icon, hint, tone ('default' | 'brand' | 'warning' | 'danger' | 'success')
 */
const toneStyles = {
  default: 'bg-surface-muted text-ink-muted',
  brand:   'bg-brand-50 text-brand-800',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger:  'bg-danger-soft text-danger',
  info:    'bg-info-soft text-info',
};

export function StatCard({ label, value, icon, hint, tone = 'default', className = '' }) {
  return (
    <div
      className={[
        'bg-surface border border-line rounded-xl shadow-card p-5 space-y-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        {icon && (
          <span
            className={[
              'w-8 h-8 rounded-lg flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4',
              toneStyles[tone] ?? toneStyles.default,
            ].join(' ')}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-ink tabular-nums leading-none">{value}</div>
      {hint && <p className="text-[11px] text-ink-subtle leading-snug">{hint}</p>}
    </div>
  );
}
