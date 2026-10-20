import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

/**
 * FarmDex ThemeToggle — Premium animated Sun/Moon toggle button.
 *
 * Smooth rotation and crossfade animation between sun and moon states,
 * keyboard accessibility, tactile active state, and tooltip.
 */
export default function ThemeToggle({ className = '', size = 'md' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      className={[
        'relative inline-flex items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        'active:scale-95',
        // Subtle background & border matching Navbar chrome
        isDark
          ? 'bg-surface border-line text-emerald-400 hover:text-emerald-300 hover:bg-surface-muted hover:border-line-strong hover:shadow-[0_0_12px_rgba(52,211,153,0.18)]'
          : 'bg-surface border-line text-amber-600 hover:text-amber-700 hover:bg-surface-muted hover:border-line-strong hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]',
        size === 'sm' ? 'w-8 h-8' : 'w-9 h-9',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon (Light mode) */}
        <Sun
          className={[
            'w-4.5 h-4.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform absolute',
            isDark
              ? 'rotate-90 scale-0 opacity-0 pointer-events-none'
              : 'rotate-0 scale-100 opacity-100',
          ].join(' ')}
          strokeWidth={2}
          aria-hidden="true"
        />

        {/* Moon Icon (Dark mode) */}
        <Moon
          className={[
            'w-4.5 h-4.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform absolute',
            isDark
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0 pointer-events-none',
          ].join(' ')}
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

/**
 * Mobile drawer row toggle with label + animated sliding pill switch.
 */
export function MobileThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className={[
        'flex items-center justify-between px-3 py-2.5 rounded-lg border border-line bg-surface-muted/40 transition-colors',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={[
            'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
            isDark ? 'bg-brand-50 text-emerald-400' : 'bg-brand-50 text-amber-600',
          ].join(' ')}
        >
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-sm font-medium text-ink">Appearance</span>
          <span className="text-[11px] text-ink-subtle">
            {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
          </span>
        </div>
      </div>

      {/* Animated capsule switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          isDark ? 'bg-brand-800' : 'bg-line-strong',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center',
            isDark ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        >
          {isDark ? (
            <Moon className="w-2.5 h-2.5 text-brand-900" />
          ) : (
            <Sun className="w-2.5 h-2.5 text-amber-600" />
          )}
        </span>
      </button>
    </div>
  );
}
