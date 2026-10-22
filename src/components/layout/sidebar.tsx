'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Map,
  FileSpreadsheet,
  Cpu,
  FileCheck2,
  Wheat,
  Sprout,
  Tractor,
  CalendarDays,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  Activity,
  Droplet,
  FlaskConical,
  Bug,
  ShieldCheck,
  CloudSun,
  Timer,
  Sun,
  Package,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const moduleSections = [
    {
      group: 'Core Management',
      items: [
        { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Farmer Management', href: '/farmers', icon: Users },
        { label: 'Farm & Land Parcels', href: '/farms', icon: Map },
        { label: 'Seed Catalog & Stock', href: '/seed-catalog', icon: Sprout },
      ],
    },
    {
      group: 'Soil Intelligence',
      items: [
        { label: 'Soil Test Reports', href: '/soil-reports', icon: FileSpreadsheet },
        { label: 'AI Soil Analysis', href: '/soil-analysis', icon: Cpu },
        { label: 'Soil Health Cards', href: '/soil-cards', icon: FileCheck2 },
      ],
    },
    {
      group: 'Cultivation Lifecycle',
      items: [
        { label: 'Crop Suitability', href: '/crop-suitability', icon: Wheat },
        { label: 'Land Preparation', href: '/land-prep', icon: Tractor },
        { label: 'Sowing & Planting', href: '/sowing', icon: CalendarDays },
      ],
    },
    /*
    {
      group: 'In-Season Crop Care',
      items: [
        { label: 'Crop Growth & Canopy', href: '/crop-growth', icon: Activity },
        { label: 'Irrigation Management', href: '/irrigation', icon: Droplet },
        { label: 'Fertilizer Catalog & Stock', href: '/fertilizers', icon: FlaskConical },
        { label: 'Fertilizer & Nutrients Plan', href: '/nutrients', icon: Layers },
        { label: 'Pest & Disease Detection', href: '/pest-detection', icon: Bug },
        { label: 'Crop Protection (IPM)', href: '/crop-protection', icon: ShieldCheck },
        { label: 'Weather & Climate', href: '/weather', icon: CloudSun },
      ],
    },
    {
      group: 'Harvest & Operations',
      items: [
        { label: 'Harvest Readiness', href: '/harvest-readiness', icon: Timer },
        { label: 'Harvest Operations', href: '/harvest-management', icon: Tractor },
        { label: 'Post-Harvest & QC', href: '/post-harvest', icon: Sun },
      ],
    },
    */
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#193D2A] text-white select-none">
      {/* Brand Header */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} border-b border-[#245C3A]/60 transition-all`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer group"
            title="Expand Sidebar"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm transition-colors">
              <Sprout className="h-5 w-5 text-white" />
            </div>
          </button>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="flex items-center overflow-hidden py-1 group"
              title="Crop360 AI - Agronomy Platform"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                <Sprout className="h-5 w-5 text-white" />
              </div>

              <div className="flex flex-col ml-3 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-bold text-white tracking-tight leading-tight">
                    Crop360
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-[#A8C5A0] tracking-normal leading-tight mt-0.5">
                  Agronomy Platform
                </span>
              </div>
            </Link>

            {/* Desktop Collapse Toggle Button (Simple, clean, no harsh outline) */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-2"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Mobile Close Toggle */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex md:hidden h-7 w-7 items-center justify-center rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-2"
              title="Close Navigation"
              aria-label="Close Navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-thin">
        {moduleSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#CFDEC9]/70">
                {section.group}
              </p>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#245C3A] text-white shadow-xs font-semibold'
                      : 'text-[#CFDEC9] hover:text-white hover:bg-[#245C3A]/60'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-[#CFDEC9]'}`}
                  />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
     
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-200 border-r border-[#245C3A] ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-[#193D2A] shadow-xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
