import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, User, Tractor, LogOut, LayoutDashboard, ShoppingBag, Store, Handshake, ShieldCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadMessagesCount, isConnected } = useSocket();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">FarmDex</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-1 sm:space-x-3 text-sm font-medium">
          <Link
            to="/marketplace"
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              isActive('/marketplace') || location.pathname.startsWith('/crops')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Marketplace</span>
          </Link>

          <Link
            to="/"
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              location.pathname === '/'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">System Health</span>
          </Link>

          {isAuthenticated && (
            <>
              {user?.role === 'FARMER' && (
                <>
                  <Link
                    to="/my-listings"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/my-listings')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Sprout className="w-4 h-4" />
                    <span>My Produce</span>
                  </Link>

                  <Link
                    to="/farms"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/farms')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Tractor className="w-4 h-4" />
                    <span>My Farms</span>
                  </Link>
                </>
              )}

              <Link
                to="/offers"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/offers')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Handshake className="w-4 h-4" />
                <span>{user?.role === 'FARMER' ? 'Trade Offers' : 'My Offers'}</span>
              </Link>

              <Link
                to="/orders"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/orders')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Orders</span>
              </Link>

              {/* Real-Time Chat Link */}
              <Link
                to="/messages"
                className={`relative px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/messages')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
                {unreadMessagesCount > 0 && (
                  <span className="min-w-[16px] h-[16px] px-1 bg-emerald-500 text-slate-950 font-bold rounded-full text-[10px] flex items-center justify-center font-mono">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/profile')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </Link>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 font-semibold ${
                    isActive('/admin')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-amber-400 hover:text-amber-200 hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Auth Buttons / Notifications / Profile Menu */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Notification Popover Dropdown */}
              <NotificationDropdown />

              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
                <span className="text-[10px] font-mono text-emerald-400 uppercase flex items-center justify-end gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-800 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-md"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
