import React from 'react';

/**
 * FarmDex Badge + StatusBadge
 *
 * Badge:        generic coloured tag
 * StatusBadge:  maps domain status strings to semantic colours
 */

const colourMap = {
  default: 'bg-surface-sunken text-ink-muted border-line',
  brand:   'bg-brand-50 text-brand-800 border-brand-200',
  success: 'bg-success-soft text-success border-success-edge',
  warning: 'bg-warning-soft text-warning border-warning-edge',
  danger:  'bg-danger-soft text-danger border-danger-edge',
  info:    'bg-info-soft text-info border-info-edge',
  purple:  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
};

export function Badge({ colour = 'default', size = 'md', icon, children, className = '' }) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-medium rounded-full border whitespace-nowrap',
        padding,
        colourMap[colour] ?? colourMap.default,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className="shrink-0 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
      {children}
    </span>
  );
}

/** Maps a domain status string to a colour slug and label. */
const offerStatusMap = {
  PENDING:   { colour: 'warning', label: 'Pending' },
  COUNTERED: { colour: 'purple',  label: 'Countered' },
  ACCEPTED:  { colour: 'success', label: 'Accepted' },
  REJECTED:  { colour: 'danger',  label: 'Declined' },
  CANCELLED: { colour: 'default', label: 'Cancelled' },
};

const orderStatusMap = {
  CONFIRMED:        { colour: 'success', label: 'Confirmed' },
  PENDING:          { colour: 'warning', label: 'Pending' },
  SHIPPED:          { colour: 'info',    label: 'Dispatched' },
  DISPATCHED:       { colour: 'info',    label: 'Dispatched' },
  IN_TRANSIT:       { colour: 'purple',  label: 'In Transit' },
  OUT_FOR_DELIVERY: { colour: 'warning', label: 'Out for Delivery' },
  DELIVERED:        { colour: 'success', label: 'Delivered' },
  CANCELLED:        { colour: 'danger',  label: 'Cancelled' },
};

const paymentStatusMap = {
  SUCCESS: { colour: 'success', label: 'Paid' },
  PENDING: { colour: 'warning', label: 'Unpaid' },
  FAILED:  { colour: 'danger',  label: 'Failed' },
};

const listingStatusMap = {
  ACTIVE:   { colour: 'success', label: 'Active' },
  INACTIVE: { colour: 'default', label: 'Inactive' },
  SOLD_OUT: { colour: 'warning', label: 'Sold Out' },
  ARCHIVED: { colour: 'danger',  label: 'Archived' },
};

export function StatusBadge({ type = 'offer', status = '', size = 'md', className = '' }) {
  const map =
    type === 'offer'   ? offerStatusMap :
    type === 'order'   ? orderStatusMap :
    type === 'payment' ? paymentStatusMap :
    type === 'listing' ? listingStatusMap :
    {};

  const resolved = map[status?.toUpperCase()];
  const colour = resolved?.colour ?? 'default';
  const label  = resolved?.label  ?? status;

  return <Badge colour={colour} size={size} className={className}>{label}</Badge>;
}
