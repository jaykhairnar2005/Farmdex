import React from 'react';

/**
 * FarmDex Card primitives
 * Consistent surface, hairline border, soft elevation.
 */

export function Card({ as: Tag = 'div', interactive = false, className = '', children, ...props }) {
  return (
    <Tag
      {...props}
      className={[
        'bg-surface border border-line rounded-xl shadow-card',
        interactive && 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer',
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
      className={['px-5 py-4 border-b border-line', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export function CardBody({ className = '', children, ...props }) {
  return (
    <div {...props} className={['p-5', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      {...props}
      className={['px-5 py-3.5 border-t border-line bg-surface-muted/50', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
