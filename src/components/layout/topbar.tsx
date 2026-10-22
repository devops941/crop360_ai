'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { SafeUser } from '@/types';
import { toast } from 'react-toastify';
import { ThemeToggle } from './theme-toggle';

interface TopbarProps {
  user: SafeUser | null;
  onOpenMobileSidebar: () => void;
}

export function Topbar({ user, onOpenMobileSidebar }: TopbarProps) {
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.info('Signed out successfully.');
      setShowLogoutModal(false);
      // Automatically redirect to home page cleanly
      window.location.href = '/';
    } catch {
      toast.error('Failed to log out');
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-[#FAFAF6] dark:bg-[#151e17] border-b border-[#E3E8DF] dark:border-[#245C3A]/30 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Navigation Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-lg text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: Theme Selector & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Theme Selector */}
        <ThemeToggle />

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-[#F1F5EE] dark:hover:bg-stone-800 transition-colors shadow-sm"
            aria-expanded={userDropdownOpen}
            aria-label="User profile menu"
          >
            <div className="h-7 w-7 rounded-md bg-[#245C3A] text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user?.name || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || <UserIcon className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-[#252B26] dark:text-stone-100 leading-tight max-w-[120px] truncate">
                {user?.name || user?.email?.split('@')[0] || 'Farmer User'}
              </span>
              <span className="text-[10px] uppercase font-mono text-[#245C3A] dark:text-emerald-400">
                {user?.role || 'Farmer'}
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#687168] dark:text-stone-400 transition-transform duration-150 ${
                userDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-[#E3E8DF] dark:border-stone-800">
                <p className="text-xs font-bold text-[#252B26] dark:text-stone-100 truncate">
                  {user?.name || user?.email?.split('@')[0] || 'Farmer User'}
                </p>
                {user?.email && (
                  <p className="text-[11px] text-[#687168] dark:text-stone-400 truncate">
                    {user.email}
                  </p>
                )}
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800 transition-colors"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#245C3A] dark:text-emerald-400" />
                  <span>Executive Dashboard</span>
                </Link>
                <Link
                  href="/audit-logs"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800 transition-colors"
                >
                  <ClipboardList className="h-3.5 w-3.5 text-[#245C3A] dark:text-emerald-400" />
                  <span>Audit Trail Log</span>
                </Link>
              </div>

              <div className="my-1 border-t border-[#E3E8DF] dark:border-stone-800" />

              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal Popup */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#252B26] dark:text-white">
                  Confirm Sign Out
                </h3>
                <p className="text-xs text-[#687168] dark:text-stone-400 mt-1 leading-relaxed">
                  Are you sure you want to sign out of your account? You will need to log back in to access your workspace.
                </p>
                {user?.email && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-300 truncate">
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800/80">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={confirmLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-60"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Okay, Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
