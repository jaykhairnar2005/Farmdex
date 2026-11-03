import React from 'react';
import { Link } from 'react-router-dom';

/**
 * FarmDex PageHeader
 * Consistent page top: eyebrow, title, subtitle, breadcrumbs, actions slot.
 */
export function PageHeader({ eyebrow, title, subtitle, icon, breadcrumbs, actions, className = '' }) {
  return (
    <div className={['pb-5 border-b border-line', className].filter(Boolean).join(' ')}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-subtle mb-3">
          {breadcrumbs.map((crumb, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1.5">
                {crumb.to && !last ? (
                  <Link to={crumb.to} className="hover:text-ink transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={last ? 'text-ink-muted font-medium' : ''}>{crumb.label}</span>
                )}
                {!last && <span className="text-ink-subtle/60">/</span>}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {icon && (
            <span className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950 dark:to-brand-900 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6 shadow-sm">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-lime-100/80 dark:bg-lime-950/60 border border-lime-300/60 dark:border-lime-700/60 text-[11px] font-semibold tracking-wider text-lime-800 dark:text-lime-300 mb-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-lime-400" />
                {eyebrow}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-ink tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-ink-muted mt-1 leading-relaxed max-w-3xl">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
