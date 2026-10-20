import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * FarmDex Pagination
 * Compact, accessible prev/next with current page indicator.
 */
export function Pagination({ page, totalPages, onChange, className = '' }) {
  if (!totalPages || totalPages <= 1) return null;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const btn =
    'inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium rounded-lg border border-line bg-surface text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-muted cursor-pointer';

  return (
    <nav
      aria-label="Pagination"
      className={['flex items-center justify-between gap-4 pt-6', className]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        onClick={() => onChange?.(Math.max(1, page - 1))}
        disabled={!canPrev}
        className={btn}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <span className="text-sm text-ink-muted tabular-nums">
        Page <span className="font-semibold text-ink">{page}</span> of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onChange?.(Math.min(totalPages, page + 1))}
        disabled={!canNext}
        className={btn}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
