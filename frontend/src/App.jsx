import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Sprout, Server, Database, CheckCircle2, XCircle, RefreshCw, Layers, LogOut, User, ShieldCheck } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { fetchApiHealth, fetchDbHealth } from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProtectedRoute } from './routes/ProtectedRoute';

function HomeDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [apiState, setApiState] = useState({ loading: true, data: null, error: null });
  const [dbState, setDbState] = useState({ loading: true, data: null, error: null });
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const verifyHealth = useCallback(async () => {
    setApiState((prev) => ({ ...prev, loading: true }));
    setDbState((prev) => ({ ...prev, loading: true }));

    const apiRes = await fetchApiHealth();
    if (apiRes.success) {
      setApiState({ loading: false, data: apiRes, error: null });
    } else {
      setApiState({ loading: false, data: null, error: apiRes.message });
    }

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
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
                  Milestone 2B Auth Active
                </span>
              </h1>
              <p className="text-sm text-slate-400">Real-Time Agricultural Marketplace &amp; Trading Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                <User className="w-4 h-4 text-emerald-400" />
                <div className="text-xs">
                  <div className="font-semibold text-slate-200">{user?.name}</div>
                  <div className="text-slate-400 font-mono text-[10px] uppercase">{user?.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer ml-2"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-medium rounded-lg border border-slate-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg shadow-md shadow-emerald-950/40 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
            <button
              onClick={verifyHealth}
              disabled={apiState.loading || dbState.loading}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${apiState.loading || dbState.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* System Health Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* User Session Info Card */}
        {isAuthenticated && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Active Authenticated Session
            </h3>
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
              <p><span className="text-slate-500">User ID:</span> {user.id}</p>
              <p><span className="text-slate-500">Name:</span> {user.name}</p>
              <p><span className="text-slate-500">Email:</span> {user.email}</p>
              <p><span className="text-slate-500">Role:</span> <span className="text-emerald-400">{user.role}</span></p>
              {user.farmerProfile && (
                <p><span className="text-slate-500">Farm Name:</span> {user.farmerProfile.farmName || 'Not specified'}</p>
              )}
              {user.buyerProfile && (
                <p><span className="text-slate-500">Business Name:</span> {user.buyerProfile.businessName || 'Not specified'}</p>
              )}
            </div>
          </section>
        )}
      </div>

      <footer className="max-w-5xl mx-auto w-full mt-8 pt-4 border-t border-slate-900 text-xs text-slate-500 flex justify-between items-center">
        <span>FarmDex Authentication Layer Active</span>
        {lastRefreshed && <span>Verified: {lastRefreshed}</span>}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
