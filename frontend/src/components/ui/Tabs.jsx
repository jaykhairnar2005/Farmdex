import React from 'react';

/**
 * FarmDex Tabs
 * Underline-style tab navigation. Works for filter bars too.
 *
 * items: [{ id, label, badge? }]
 * value: active id
 * onChange: (id) => void
 */
export function Tabs({ items, value, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={['flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-line', className]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(item.id)}
            className={[
              'relative px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer',
              '-mb-px border-b-2',
              active
                ? 'border-brand-800 text-brand-800'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-line',
            ].join(' ')}
          >
            {item.label}
            {item.badge != null && (
              <span
                className={[
                  'ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold',
                  active ? 'bg-brand-800 text-white' : 'bg-surface-sunken text-ink-muted',
                ].join(' ')}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Pill-style filter bar (used on offers/orders status filters).
 * items: [{ id, label }]
 */
export function FilterPills({ items, value, onChange, className = '' }) {
  return (
    <div
      className={['flex items-center gap-2 overflow-x-auto no-scrollbar', className]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            onClick={() => onChange?.(item.id)}
            className={[
              'px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border',
              active
                ? 'bg-brand-800 text-white border-transparent'
                : 'bg-surface text-ink-muted border-line hover:text-ink hover:bg-surface-muted',
            ].join(' ')}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
