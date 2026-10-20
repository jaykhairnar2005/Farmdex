import React, { useId, useState } from 'react';

/**
 * FarmDex Tooltip — lightweight, CSS-positioned, no dependencies.
 * Wraps any element and shows a small label on hover/focus.
 *
 * <Tooltip label="Edit listing"><button>…</button></Tooltip>
 */
export function Tooltip({ label, side = 'top', children, className = '' }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  if (!label) return children;

  const pos = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left:   'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right:  'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[side];

  return (
    <span
      className={['relative inline-flex', className].filter(Boolean).join(' ')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={[
            'absolute z-50 px-2 py-1 text-[11px] font-medium rounded-md whitespace-nowrap pointer-events-none',
            'bg-ink text-canvas shadow-popover scale-in',
            pos,
          ].join(' ')}
        >
          {label}
        </span>
      )}
    </span>
  );
}
