import React from 'react';

/**
 * FarmDex StatCard
 * Compact, honest metric card. No fabricated trends.
 *
 * Props: label, value, icon, hint, tone ('default' | 'brand' | 'warning' | 'danger' | 'success')
 */
const toneStyles = {
  default: 'bg-surface-muted text-ink-muted border-line',
  brand:   'bg-brand-50 text-brand-800 border-brand-200/80 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/60',
  lime:    'bg-lime-50 text-lime-800 border-lime-300/80 dark:bg-lime-950/60 dark:text-lime-300 dark:border-lime-700/60',
  success: 'bg-success-soft text-success border-success-edge',
  warning: 'bg-warning-soft text-warning border-warning-edge',
  danger:  'bg-danger-soft text-danger border-danger-edge',
  info:    'bg-info-soft text-info border-info-edge',
};

export function StatCard({ label, value, icon, hint, trend, tone = 'default', className = '' }) {
  return (
    <div
      className={[
        'bg-surface border border-line rounded-2xl shadow-card p-5.5 card-lift space-y-3 relative overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</span>
        {icon && (
          <span
            className={[
              'w-10 h-10 rounded-xl border flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 shadow-sm transition-transform duration-200 group-hover:scale-110',
              toneStyles[tone] ?? toneStyles.default,
            ].join(' ')}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight tabular-nums">{value}</div>
        {trend && (
          <span
            className={[
              'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border',
              trend.positive
                ? 'bg-success-soft text-success border-success-edge'
                : 'bg-danger-soft text-danger border-danger-edge',
            ].join(' ')}
          >
            {trend.value}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-ink-subtle leading-snug">{hint}</p>}
    </div>
  );
}
