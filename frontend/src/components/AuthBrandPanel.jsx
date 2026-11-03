import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, CheckCircle2, Sparkles } from 'lucide-react';

/**
 * Shared brand panel for the split-screen auth pages.
 * Features authentic farm photography with a rich forest green + lime aesthetic.
 */
export default function AuthBrandPanel({ headline, points = [] }) {
  return (
    <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12 select-none">
      {/* Authentic farm photography */}
      <div
        className="absolute inset-0 bg-center bg-cover scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80')",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/85 to-brand-900/85" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-lime-500 text-brand-950 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-lime-500/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 text-brand-950" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight font-heading">FarmDex</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-lime-300 border border-white/20 backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-lime-400" /> Agritech Cloud
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <h2 className="text-3xl font-extrabold text-white leading-tight font-heading tracking-tight">{headline}</h2>
        {points.length > 0 && (
          <ul className="space-y-3.5 text-white/90 text-sm">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-lime-400 shrink-0" />
                <span className="font-medium">{p}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between text-xs text-brand-200/80 pt-6 border-t border-white/15">
        <span>© {new Date().getFullYear()} FarmDex · Mandi Trading Network</span>
        <span className="flex items-center gap-1.5 text-white/70">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" /> Live Settlement Node
        </span>
      </div>
    </div>
  );
}
