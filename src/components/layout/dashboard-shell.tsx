'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { RealTimeProvider } from '@/components/providers/real-time-provider';
import { SafeUser } from '@/types';
import { Sprout } from 'lucide-react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?callbackUrl=/dashboard');
          return;
        }
        const data = await res.json();
        setUser(data.data);
      } catch {
        router.push('/login?callbackUrl=/dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-[#245C3A] text-white flex items-center justify-center animate-pulse shadow-md">
            <Sprout className="h-6 w-6 text-emerald-300" />
          </div>
          <p className="text-xs font-medium text-[#687168]">Initializing Crop360 Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <RealTimeProvider>
      <div className="flex h-screen bg-[#FAFAF6] dark:bg-[#111813] text-[#252B26] dark:text-[#E8F0E9] overflow-hidden transition-colors">
        {/* Collapsible Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar user={user} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        </div>
      </div>
    </RealTimeProvider>
  );
}
