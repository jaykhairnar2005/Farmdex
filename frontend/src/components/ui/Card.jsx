import React from 'react';

/**
 * FarmDex Card primitives
 * Consistent surface, hairline border, soft elevation.
 */

export function Card({ as: Tag = 'div', interactive = false, glass = false, className = '', children, ...props }) {
  return (
    <Tag
      {...props}
      className={[
        glass ? 'glass-panel' : 'bg-surface',
        'border border-line rounded-2xl shadow-card',
        interactive && 'card-lift cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      {...props}
      className={['px-6 py-4.5 border-b border-line flex items-center justify-between gap-4', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export function CardBody({ className = '', children, ...props }) {
  return (
    <div {...props} className={['p-6', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      {...props}
      className={['px-6 py-4 border-t border-line bg-surface-muted/40 rounded-b-2xl flex items-center justify-between gap-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
