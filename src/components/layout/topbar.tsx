'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  Globe,
  User as UserIcon,
  LogOut,
  Wifi,
  WifiOff,
  Check,
  ChevronDown,
} from 'lucide-react';
import { SafeUser } from '@/types';
import { useRealTime } from '@/components/providers/real-time-provider';
import { toast } from 'react-toastify';
import { ThemeToggle } from '@/components/layout/theme-toggle';

interface TopbarProps {
  user: SafeUser | null;
  onOpenMobileSidebar: () => void;
}

export function Topbar({ user, onOpenMobileSidebar }: TopbarProps) {
  const router = useRouter();
  const { connected, notifications, unreadCount, markAsRead, clearAll } = useRealTime();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('ta');
  const [searchQuery, setSearchQuery] = useState('');

  const languages = [
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.info('Signed out successfully.');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Failed to log out');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/farmers?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="h-16 bg-[#FAFAF6] dark:bg-[#151e17] border-b border-[#E3E8DF] dark:border-[#245C3A]/30 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-lg text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800"
          aria-label="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearch} className="relative w-full hidden sm:block">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687168] dark:text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search farmer name, mobile, survey no..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-[#252B26] dark:text-stone-100 placeholder-[#687168]/70 dark:placeholder-stone-500 focus:outline-none focus:border-[#245C3A]"
          />
        </form>
      </div>

      {/* Right Controls: Connectivity, Multilingual, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark/Light Theme Toggle */}
        <ThemeToggle />

        {/* Real-Time Live Status Pill */}
        <div
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
            connected
              ? 'bg-[#E7EFE6] dark:bg-emerald-950/60 text-[#245C3A] dark:text-emerald-400 border-[#CFDEC9] dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
          }`}
          title={connected ? 'Live Sync Active' : 'Connecting to Live Socket...'}
        >
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{connected ? 'Live Sync' : 'Reconnecting'}</span>
        </div>

        {/* Multilingual Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800 transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-[#245C3A] dark:text-emerald-400" />
            <span className="hidden sm:inline font-semibold">
              {languages.find((l) => l.code === currentLang)?.code.toUpperCase()}
            </span>
            <ChevronDown className="h-3 w-3 text-[#687168] dark:text-stone-400" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg py-1 z-40">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setCurrentLang(lang.code);
                    setLangDropdownOpen(false);
                    toast.info(`Language set to ${lang.name}`);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800"
                >
                  <span>{lang.name}</span>
                  {currentLang === lang.code && <Check className="h-3.5 w-3.5 text-[#245C3A] dark:text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#245C3A] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl py-2 z-40">
              <div className="px-4 py-2 border-b border-[#E3E8DF] dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs font-bold text-[#252B26] dark:text-stone-100">Real-Time Notifications</span>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] text-[#245C3A] dark:text-emerald-400 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#E3E8DF] dark:divide-stone-800">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-xs text-[#687168] dark:text-stone-400">No new alerts</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-[#F1F5EE] dark:hover:bg-stone-800 transition-colors ${
                        !n.read ? 'bg-[#FAFAF6] dark:bg-stone-800/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#252B26] dark:text-stone-100">{n.title}</span>
                        <span className="text-[10px] text-[#687168] dark:text-stone-400">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[#687168] dark:text-stone-300 leading-tight">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-[#F1F5EE] dark:hover:bg-stone-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-md bg-[#245C3A] text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || <UserIcon className="h-3.5 w-3.5" />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#252B26] dark:text-stone-100 leading-tight max-w-[100px] truncate">
                {user?.name || 'Farmer User'}
              </span>
              <span className="text-[10px] uppercase font-mono text-[#245C3A] dark:text-emerald-400">
                {user?.role || 'Farmer'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-[#687168] dark:text-stone-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl py-2 z-40">
              <div className="px-4 py-2 border-b border-[#E3E8DF] dark:border-stone-800">
                <p className="text-xs font-bold text-[#252B26] dark:text-stone-100">{user?.name}</p>
                <p className="text-[11px] text-[#687168] dark:text-stone-400 truncate">{user?.email}</p>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setUserDropdownOpen(false)}
                className="block px-4 py-2 text-xs text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800"
              >
                Executive Dashboard
              </Link>
              <Link
                href="/audit-logs"
                onClick={() => setUserDropdownOpen(false)}
                className="block px-4 py-2 text-xs text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-800"
              >
                Audit Trail Log
              </Link>
              <div className="my-1 border-t border-[#E3E8DF] dark:border-stone-800" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
