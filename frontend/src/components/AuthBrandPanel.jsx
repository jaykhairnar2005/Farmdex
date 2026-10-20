import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, CheckCircle2 } from 'lucide-react';

/**
 * Shared brand panel for the split-screen auth pages.
 * Uses real agricultural photography with a deep-green overlay —
 * no decorative blur circles.
 */
export default function AuthBrandPanel({ headline, points = [] }) {
  return (
    <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12">
      {/* Authentic farm photography */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80')",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-brand-950/80" aria-hidden="true" />

      <div className="relative">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center ring-1 ring-white/20">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">FarmDex</span>
        </Link>
      </div>

      <div className="relative space-y-6">
        <h2 className="text-3xl font-semibold text-white leading-tight">{headline}</h2>
        {points.length > 0 && (
          <ul className="space-y-3 text-brand-100 text-sm">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-300 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative text-sm text-brand-200">
        © {new Date().getFullYear()} FarmDex · Agricultural marketplace
      </div>
    </div>
  );
}
