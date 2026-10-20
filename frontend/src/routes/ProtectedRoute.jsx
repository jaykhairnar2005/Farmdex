import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex items-center gap-2 text-brand-800 text-sm font-medium">
          <div className="w-5 h-5 rounded-full border-2 border-brand-800 border-t-transparent animate-spin" />
          <span>Verifying authentication…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-6 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-danger-soft border border-danger-edge text-danger flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-semibold text-ink">Access denied</h2>
          <p className="text-sm text-ink-muted">
            Your account role (<span className="font-semibold text-brand-800">{user.role}</span>) is not
            authorised to view this page.
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
