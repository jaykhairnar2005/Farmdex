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
        <div className="flex items-start gap-3.5 min-w-0">
          {icon && (
            <span className="w-10 h-10 shrink-0 rounded-lg bg-brand-50 text-brand-800 border border-brand-100 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 mb-1">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
