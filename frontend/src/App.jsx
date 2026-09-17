import React, { useState, useEffect, useCallback } from 'react';
import { Sprout, Server, Database, CheckCircle2, XCircle, RefreshCw, Cpu, ShieldCheck, Layers, GitBranch } from 'lucide-react';
import { fetchApiHealth, fetchDbHealth } from './services/api';

export default function App() {
  const [apiState, setApiState] = useState({ loading: true, data: null, error: null });
  const [dbState, setDbState] = useState({ loading: true, data: null, error: null });
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const verifyHealth = useCallback(async () => {
    setApiState((prev) => ({ ...prev, loading: true }));
    setDbState((prev) => ({ ...prev, loading: true }));

    // 1. Check API Health (GET /api/health)
    const apiRes = await fetchApiHealth();
    if (apiRes.success) {
      setApiState({ loading: false, data: apiRes, error: null });
    } else {
      setApiState({ loading: false, data: null, error: apiRes.message });
    }

    // 2. Check DB Health (GET /api/health/db)
    const dbRes = await fetchDbHealth();
    if (dbRes.success) {
      setDbState({ loading: false, data: dbRes, error: null });
    } else {
      setDbState({ loading: false, data: null, error: dbRes.message });
    }

    setLastRefreshed(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    verifyHealth();
  }, [verifyHealth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Sprout className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                FarmDex
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  v1.0.0 Foundation
                </span>
              </h1>
              <p className="text-sm text-slate-400">Real-Time Agricultural Marketplace &amp; Trading Platform</p>
            </div>
          </div>
          <button
            onClick={verifyHealth}
            disabled={apiState.loading || dbState.loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${apiState.loading || dbState.loading ? 'animate-spin' : ''}`} />
            Refresh Health Pings
          </button>
        </header>

        {/* System Health Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Backend API Health */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-slate-100">Express API Health</h2>
                  <p className="text-xs text-slate-400 font-mono">GET /api/health</p>
                </div>
              </div>
              {apiState.loading ? (
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 animate-pulse">Checking...</span>
              ) : apiState.data ? (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" /> Error
                </span>
              )}
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono text-sm space-y-1 text-slate-300">
              {apiState.loading ? (
                <p className="text-slate-500">Executing Axios request to Express endpoint...</p>
              ) : apiState.data ? (
                <>
                  <p className="text-emerald-400 font-semibold">{apiState.data.message}</p>
                  <p className="text-xs text-slate-500">Status: 200 OK | Response: JSON</p>
                </>
              ) : (
                <p className="text-rose-400 text-xs">{apiState.error || 'Failed to reach API server'}</p>
              )}
            </div>
          </div>

          {/* Card 2: Database Connection Health */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-slate-100">PostgreSQL / Prisma DB</h2>
                  <p className="text-xs text-slate-400 font-mono">GET /api/health/db</p>
                </div>
              </div>
              {dbState.loading ? (
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 animate-pulse">Checking...</span>
              ) : dbState.data ? (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" /> Unreachable
                </span>
              )}
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono text-sm space-y-1 text-slate-300">
              {dbState.loading ? (
                <p className="text-slate-500">Querying PostgreSQL via Prisma ORM...</p>
              ) : dbState.data ? (
                <>
                  <p className="text-emerald-400 font-semibold">{dbState.data.message}</p>
                  <p className="text-xs text-slate-500">DB Timestamp: {new Date(dbState.data.timestamp).toLocaleString()}</p>
                </>
              ) : (
                <p className="text-rose-400 text-xs">{dbState.error || 'Failed to query database'}</p>
              )}
            </div>
          </div>
        </section>

        {/* Architecture & Stack Details */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" /> System Foundation Stack
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block">Frontend Stack</span>
              <span className="text-slate-200 font-semibold">React 18 + Vite + Tailwind</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block">Backend Server</span>
              <span className="text-slate-200 font-semibold">Express.js + Node 24</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block">Database ORM</span>
              <span className="text-slate-200 font-semibold">Prisma + PostgreSQL 18</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block">Real-Time</span>
              <span className="text-slate-200 font-semibold">Socket.IO Ready</span>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full mt-8 pt-4 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>FarmDex Core Foundation Environment Active</span>
        </div>
        {lastRefreshed && <span>Last verified: {lastRefreshed}</span>}
      </footer>
    </div>
  );
}
