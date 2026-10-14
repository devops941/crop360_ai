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
  History,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Shield,
  HelpCircle,
  X,
  Activity,
  Droplet,
  FlaskConical,
  Bug,
  ShieldCheck,
  CloudSun,
  Target,
  ListTodo,
  Timer,
  Sun,
  Warehouse,
  BarChart3,
  Handshake,
  Truck,
  Coins,
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
        { label: '1. Farmer Management', href: '/farmers', icon: Users, count: 'M1' },
        { label: '2. Farm & Land Parcels', href: '/farms', icon: Map, count: 'M2' },
      ],
    },
    {
      group: 'Soil Intelligence',
      items: [
        {
          label: '3. Soil Test Reports',
          href: '/soil-reports',
          icon: FileSpreadsheet,
          count: 'M3',
        },
        { label: '4. AI Soil Analysis', href: '/soil-analysis', icon: Cpu, count: 'M4' },
        { label: '5. Soil Health Cards', href: '/soil-cards', icon: FileCheck2, count: 'M5' },
      ],
    },
    {
      group: 'Cultivation Lifecycle',
      items: [
        { label: '6. Crop Suitability', href: '/crop-suitability', icon: Wheat, count: 'M6' },
        { label: '7. Seed Selection', href: '/seed-selection', icon: Sprout, count: 'M7' },
        { label: '8. Land Preparation', href: '/land-prep', icon: Tractor, count: 'M8' },
        { label: '9. Sowing & Planting', href: '/sowing', icon: CalendarDays, count: 'M9' },
      ],
    },
    {
      group: 'In-Season Crop Care',
      items: [
        { label: '10. Crop Growth & Canopy', href: '/crop-growth', icon: Activity, count: 'M10' },
        { label: '11. Irrigation Management', href: '/irrigation', icon: Droplet, count: 'M11' },
        { label: '12. Fertilizer & Nutrients', href: '/nutrients', icon: FlaskConical, count: 'M12' },
        { label: '13. Pest & Disease Detection', href: '/pest-detection', icon: Bug, count: 'M13' },
        { label: '14. Crop Protection (IPM)', href: '/crop-protection', icon: ShieldCheck, count: 'M14' },
        { label: '15. Weather & Climate', href: '/weather', icon: CloudSun, count: 'M15' },
      ],
    },
    {
      group: 'Planning & Field Tasks',
      items: [
        { label: '16. Lifecycle Planner', href: '/lifecycle-plans', icon: Target, count: 'M16' },
        { label: '17. Task & Schedule', href: '/crop-tasks', icon: ListTodo, count: 'M17' },
      ],
    },
    {
      group: 'Harvest & Post-Harvest',
      items: [
        { label: '18. Harvest Readiness', href: '/harvest-readiness', icon: Timer, count: 'M18' },
        { label: '19. Harvest Operations', href: '/harvest-management', icon: Tractor, count: 'M19' },
        { label: '20. Post-Harvest & QC', href: '/post-harvest', icon: Sun, count: 'M20' },
        { label: '21. Storage & Inventory', href: '/inventory-storage', icon: Warehouse, count: 'M21' },
      ],
    },
    {
      group: 'Market & Financials',
      items: [
        { label: '22. Mandi Market Prices', href: '/market-prices', icon: BarChart3, count: 'M22' },
        { label: '23. Buyer Sales Contracts', href: '/buyer-selling', icon: Handshake, count: 'M23' },
        { label: '24. Logistics & Dispatch', href: '/logistics', icon: Truck, count: 'M24' },
        { label: '25. Cultivation Cost & P&L', href: '/cultivation-pnl', icon: Coins, count: 'M25' },
      ],
    },
    {
      group: 'Governance',
      items: [{ label: 'System Audit Logs', href: '/audit-logs', icon: History }],
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#193D2A] text-white select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#245C3A]">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center shrink-0 shadow-xs">
            <Sprout className="h-4 w-4 text-emerald-300" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-tight">
                Crop360 <span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] text-[#CFDEC9]">Agronomy Platform</span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded text-[#CFDEC9] hover:text-white hover:bg-[#245C3A] transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile Close Toggle */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex md:hidden h-7 w-7 items-center justify-center rounded text-[#CFDEC9] hover:text-white hover:bg-[#245C3A] transition-colors"
          title="Close Navigation"
          aria-label="Close Navigation"
        >
          <X className="h-4 w-4" />
        </button>
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
                  {!collapsed && item.count && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#193D2A] text-[#CFDEC9] border border-[#245C3A]">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-[#245C3A] bg-[#143021] text-[11px] text-[#CFDEC9]">
          <div className="flex items-center gap-2 mb-1 text-white font-medium">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>ICAR Standard Aligned</span>
          </div>
          <p className="text-[10px] text-[#CFDEC9]/80 leading-tight">
            Connecting soil chemistry with agricultural operations.
          </p>
        </div>
      )}
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
