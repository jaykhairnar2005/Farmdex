import React, { forwardRef } from 'react';

/**
 * FarmDex form controls
 * FormLabel · Input · Textarea · Select · Checkbox · FormField
 *
 * Inputs are unstyled of opinion in colour — just consistent geometry,
 * hairline borders, and an accessible focus ring (defined in index.css).
 */

export function FormLabel({ children, required = false, htmlFor, className = '', hint }) {
  return (
    <label
      htmlFor={htmlFor}
      className={['flex items-center justify-between text-sm font-medium text-ink', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="flex items-center gap-1">
        {children}
        {required && <span className="text-danger" aria-hidden="true">*</span>}
      </span>
      {hint && <span className="text-xs font-normal text-ink-subtle">{hint}</span>}
    </label>
  );
}

const fieldBase =
  'w-full bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle text-sm transition-colors disabled:bg-surface-sunken disabled:text-ink-subtle';

export const Input = forwardRef(function Input({ className = '', invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      aria-invalid={invalid || undefined}
      className={[fieldBase, 'h-9 px-3', invalid && 'border-danger', className]
        .filter(Boolean)
        .join(' ')}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className = '', invalid = false, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...props}
      aria-invalid={invalid || undefined}
      className={[fieldBase, 'px-3 py-2.5 resize-y', invalid && 'border-danger', className]
        .filter(Boolean)
        .join(' ')}
    />
  );
});

export const Select = forwardRef(function Select({ className = '', invalid = false, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      {...props}
      aria-invalid={invalid || undefined}
      className={[fieldBase, 'h-9 px-3 pr-8 cursor-pointer', invalid && 'border-danger', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </select>
  );
});

export function Checkbox({ className = '', children, ...props }) {
  return (
    <label className={['inline-flex items-center gap-2 cursor-pointer text-sm text-ink', className]
      .filter(Boolean)
      .join(' ')}>
      <input
        type="checkbox"
        {...props}
        className="w-4 h-4 rounded border-line text-brand-800 accent-brand-800 cursor-pointer"
      />
      {children}
    </label>
  );
}

/** Wraps a field with label, error message, and optional helper text. */
export function FormField({ label, htmlFor, required, error, hint, children, className = '' }) {
  return (
    <div className={['space-y-1.5', className].filter(Boolean).join(' ')}>
      {label && (
        <FormLabel required={required} htmlFor={htmlFor} hint={hint}>
          {label}
        </FormLabel>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
