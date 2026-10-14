'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, Menu, X, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { SafeUser } from '@/types';
import { toast } from 'react-toastify';

export function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check active user session
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.data || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast.info('You have been signed out.');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const navLinks = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Features', href: '/#features' },
    { label: 'Crop Lifecycle', href: '/#crop-lifecycle' },
    { label: 'Soil Analysis', href: '/#soil-report' },
    { label: 'Indian Crops', href: '/#indian-crops' },
    { label: 'About', href: '/#about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E3E8DF] bg-[#FAFAF6]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#245C3A] text-white">
              <Sprout className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-[#252B26] leading-none">
                Crop360 <span className="text-[#245C3A]">AI</span>
              </span>
              <span className="text-[10px] text-[#687168] mt-0.5">Indian Agriculture</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-medium text-[#252B26]/80 hover:text-[#245C3A] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action: Auth States */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && user ? (
              // Authenticated user state
              <div className="flex items-center gap-2.5">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E3E8DF] bg-white hover:bg-[#F1F5EE] text-[#252B26] transition-colors"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#245C3A]" />
                  <span>Dashboard</span>
                </Link>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E7EFE6] text-[#245C3A] text-xs font-semibold">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-white text-[#193D2A]">
                    {user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg border border-[#E3E8DF] text-[#687168] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : !loading ? (
              // Unauthenticated state: Login & Register
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-[#252B26] hover:text-[#245C3A] transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors shadow-xs"
                >
                  <span>Register Free</span>
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-[#252B26] hover:bg-[#F1F5EE]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3E8DF] bg-[#FAFAF6] px-4 py-4 space-y-2">
          {user && (
            <div className="p-3 mb-2 rounded-lg bg-[#E7EFE6] border border-[#CFDEC9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-[#245C3A]" />
                <span className="text-xs font-bold text-[#193D2A]">{user.name}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-[#193D2A]">
                {user.role}
              </span>
            </div>
          )}

          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#252B26] rounded-md hover:bg-[#F1F5EE]"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 border-t border-[#E3E8DF] space-y-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center text-xs font-semibold rounded-lg bg-[#245C3A] text-white"
                >
                  Open Farm Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full py-2 text-center text-xs font-medium rounded-lg border border-[#E3E8DF] text-rose-600 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-center text-xs font-semibold rounded-lg border border-[#E3E8DF] bg-white text-[#252B26]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-center text-xs font-semibold rounded-lg bg-[#245C3A] text-white"
                >
                  Register Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
