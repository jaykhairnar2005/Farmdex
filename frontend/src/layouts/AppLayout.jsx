import React from 'react';
import Navbar from '../components/Navbar';

/**
 * FarmDex AppLayout — shared application shell.
 *
 * Replaces the per-page <div className="min-h-screen bg-…"> + <Navbar /> pattern
 * so every authenticated page shares the same chrome, spacing, and width.
 *
 * Props:
 *  children     page content
 *  width        'narrow' (max-w-6xl) | 'wide' (max-w-7xl) | 'full'
 *  footer       optional footer node (for public pages)
 *  className    extra main classes
 */
const widthMap = {
  narrow: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-full',
};

export function AppLayout({ children, width = 'wide', footer = null, className = '' }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />
      <main
        className={[
          'flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
          widthMap[width] ?? widthMap.wide,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}

export default AppLayout;
