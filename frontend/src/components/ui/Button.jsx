import React from 'react';
import { Link } from 'react-router-dom';

/**
 * FarmDex Button
 *
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
 * size:    'sm' | 'md' | 'lg'
 * loading: shows spinner, disables interaction
 * icon:    leading icon element
 * iconEnd: trailing icon element
 */

const variants = {
  primary:
    'bg-brand-800 text-white border-transparent hover:bg-brand-900 active:scale-[0.98] shadow-sm hover:shadow-card-hover disabled:bg-brand-200 disabled:text-brand-50 disabled:shadow-none',
  lime:
    'bg-lime-500 text-brand-950 font-semibold border-lime-600/30 hover:bg-lime-400 active:scale-[0.98] shadow-sm hover:shadow-lime transition-all duration-200 disabled:opacity-40 disabled:shadow-none',
  secondary:
    'bg-surface text-ink border-line hover:bg-surface-muted hover:border-line-strong active:scale-[0.98] shadow-sm disabled:opacity-40',
  ghost:
    'bg-transparent text-ink-muted border-transparent hover:bg-surface-muted hover:text-ink active:scale-[0.98] disabled:opacity-40',
  danger:
    'bg-danger text-white border-transparent hover:bg-red-700 active:scale-[0.98] shadow-sm disabled:opacity-40',
  outline:
    'bg-transparent text-brand-800 dark:text-brand-300 border-brand-800/40 hover:bg-brand-50/60 dark:hover:bg-brand-950/60 hover:border-brand-800 active:scale-[0.98] disabled:opacity-40',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconEnd,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={[
        'inline-flex items-center justify-center font-medium border transition-colors cursor-pointer whitespace-nowrap select-none',
        'focus-visible:outline-none',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        loading && 'pointer-events-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconEnd && <span className="shrink-0">{iconEnd}</span>}
    </button>
  );
}

function Spinner({ size }) {
  const dim = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span
      className={`${dim} border-2 border-current border-t-transparent rounded-full animate-spin`}
      aria-hidden="true"
    />
  );
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  loading = false,
  className = '',
  children,
  ...props
}) {
  const dims = { sm: 'w-7 h-7 rounded-md', md: 'w-9 h-9 rounded-lg', lg: 'w-11 h-11 rounded-lg' };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={[
        'inline-flex items-center justify-center border transition-colors cursor-pointer',
        variants[variant] ?? variants.ghost,
        dims[size] ?? dims.md,
        loading && 'pointer-events-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      ) : (
        children
      )}
    </button>
  );
}

/**
 * ButtonLink — react-router Link styled identically to a Button.
 * Use instead of wrapping <Link> around a <Button> (avoids a/button nesting).
 */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  className = '',
  children,
  ...props
}) {
  return (
    <Link
      to={to}
      {...props}
      className={[
        'inline-flex items-center justify-center font-medium border transition-all duration-200 whitespace-nowrap select-none cursor-pointer active:scale-[0.98]',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {iconEnd && <span className="shrink-0">{iconEnd}</span>}
    </Link>
  );
}
