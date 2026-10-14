'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  ArrowRight,
  TrendingUp,
  CheckCircle2,
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
import { SafeUser } from '@/types';

export default function DashboardPage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [stats, setStats] = useState({
    farmersCount: 0,
    farmsCount: 0,
    cultivableAcres: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, farmersRes, farmsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/farmers'),
          fetch('/api/farms'),
        ]);

        if (meRes.ok) {
          const json = await meRes.json();
          setUser(json.data);
        }
        if (farmersRes.ok) {
          const json = await farmersRes.json();
          setStats((prev) => ({ ...prev, farmersCount: json.data?.length || 0 }));
        }
        if (farmsRes.ok) {
          const json = await farmsRes.json();
          const list = json.data || [];
          const totalAcres = list.reduce(
            (acc: number, f: any) => acc + (Number(f.cultivableAreaAcres) || 0),
            0
          );
          setStats((prev) => ({
            ...prev,
            farmsCount: list.length,
            cultivableAcres: Math.round(totalAcres * 10) / 10,
          }));
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      }
    }
    loadData();
  }, []);

  const modules = [
    {
      id: 'm1',
      title: '1. Farmer Management',
      desc: 'Centralized farmer identities, contact registry, Aadhaar, and FPO associations.',
      icon: Users,
      href: '/farmers',
      metric: `${stats.farmersCount} Registered`,
      status: 'Active',
    },
    {
      id: 'm2',
      title: '2. Farm & Land Parcels',
      desc: 'Survey numbers, Patta passbooks, soil classification, and irrigation mapping.',
      icon: Map,
      href: '/farms',
      metric: `${stats.farmsCount} Parcels (${stats.cultivableAcres} ac)`,
      status: 'Active',
    },
    {
      id: 'm3',
      title: '3. Soil Test Report Upload',
      desc: 'Upload laboratory PDF reports, run OCR extraction, or record 12-parameter values.',
      icon: FileSpreadsheet,
      href: '/soil-reports',
      metric: 'Ready for Upload',
      status: 'Phase 3',
    },
    {
      id: 'm4',
      title: '4. AI Soil Analysis Engine',
      desc: 'NPK deficiency rating, electrical conductivity, pH remediation, and micronutrients.',
      icon: Cpu,
      href: '/soil-analysis',
      metric: 'AI Engine Ready',
      status: 'Phase 3',
    },
    {
      id: 'm5',
      title: '5. Soil Health Card Generation',
      desc: 'Generate printable Soil Health Cards with customized fertilizer dosage per acre.',
      icon: FileCheck2,
      href: '/soil-cards',
      metric: 'SHC Aligned',
      status: 'Phase 3',
    },
    {
      id: 'm6',
      title: '6. Crop Suitability & Matching',
      desc: 'Predict high-yield crops matching soil NPK, seasonal rainfall, and mandi economics.',
      icon: Wheat,
      href: '/crop-recommendations',
      metric: '6 Crops Covered',
      status: 'Phase 4',
    },
    {
      id: 'm7',
      title: '7. Seed Selection & Treatment',
      desc: 'Certified seed varieties, seed rate calculations, and bio-fungicide inoculation steps.',
      icon: Sprout,
      href: '/seeds',
      metric: 'ICAR Varieties',
      status: 'Phase 4',
    },
    {
      id: 'm8',
      title: '8. Land Preparation Roadmap',
      desc: 'Chisel plowing schedules, rotavator harrowing, and basal compost/gypsum incorporation.',
      icon: Tractor,
      href: '/land-preparation',
      metric: 'Tillage Schedules',
      status: 'Phase 4',
    },
    {
      id: 'm9',
      title: '9. Sowing & Planting Operations',
      desc: 'Optimal sowing windows, row spacing, nursery management, and initial irrigation.',
      icon: CalendarDays,
      href: '/sowing',
      metric: 'Spacing & Nursery',
      status: 'Phase 4',
    },
    {
      id: 'm10',
      title: '10. Crop Growth & Canopy Monitoring',
      desc: 'BBCH phenological milestones, plant height, canopy interception %, and health stress alerts.',
      icon: Activity,
      href: '/crop-growth',
      metric: 'Phenology Active',
      status: 'Phase 5',
    },
    {
      id: 'm11',
      title: '11. Irrigation Management & ETc',
      desc: 'Scientific water budgets, evapotranspiration ETc, moisture depletion, and pump run-times.',
      icon: Droplet,
      href: '/irrigation',
      metric: 'Water Budgeting',
      status: 'Phase 5',
    },
    {
      id: 'm12',
      title: '12. Fertilizer & Nutrients',
      desc: 'Precision split-dose fertigation, basal application, foliar nutrition, and ICAR crop response curves.',
      icon: FlaskConical,
      href: '/nutrients',
      metric: 'Split Fertigation',
      status: 'Phase 5',
    },
    {
      id: 'm13',
      title: '13. Pest & Disease Detection',
      desc: 'AI computer vision diagnostics, ETL economic threshold tracking, and pathology logs.',
      icon: Bug,
      href: '/pest-detection',
      metric: 'AI Diagnostic',
      status: 'Phase 5',
    },
    {
      id: 'm14',
      title: '14. Crop Protection (IPM)',
      desc: 'Integrated Pest Management, biological formulations, CIBRC standards, and Pre-Harvest Intervals (PHI).',
      icon: ShieldCheck,
      href: '/crop-protection',
      metric: 'IPM Formulations',
      status: 'Phase 5',
    },
    {
      id: 'm15',
      title: '15. Weather & Climate',
      desc: 'Hyper-local 7-day IMD Agromet forecasts, Growing Degree Days (GDD), and safe spray window alerts.',
      icon: CloudSun,
      href: '/weather',
      metric: 'IMD Agromet 7-Day',
      status: 'Phase 5',
    },
    {
      id: 'm16',
      title: '16. AI Lifecycle Planning',
      desc: 'Automated end-to-end master dynamic roadmap synthesizing soil, crop phenology, and harvest milestones.',
      icon: Target,
      href: '/lifecycle-plans',
      metric: 'Milestone Roadmaps',
      status: 'Phase 6',
    },
    {
      id: 'm17',
      title: '17. Task & Schedule Engine',
      desc: 'Farm operational task planner, labor allocation, machinery dispatch, and execution tracking.',
      icon: ListTodo,
      href: '/crop-tasks',
      metric: 'Labor Operations',
      status: 'Phase 6',
    },
    {
      id: 'm18',
      title: '18. Harvest Readiness Prediction',
      desc: 'GDD heat unit accumulation, grain moisture levels, visual husk maturity, and 3-day optimal window.',
      icon: Timer,
      href: '/harvest-readiness',
      metric: 'Optimal 3-Day Window',
      status: 'Phase 7',
    },
    {
      id: 'm19',
      title: '19. Harvest Management',
      desc: 'Combine harvester field recording, moisture at threshing, bag counts, and FAQ grain grading.',
      icon: Tractor,
      href: '/harvest-management',
      metric: 'Combine Threshing',
      status: 'Phase 7',
    },
    {
      id: 'm20',
      title: '20. Post-Harvest & Conditioning',
      desc: 'Moisture reduction to safe 12–14% equilibrium, foreign matter cleaning, winnowing, and QC certificates.',
      icon: Sun,
      href: '/post-harvest',
      metric: 'Moisture QC Safe',
      status: 'Phase 7',
    },
    {
      id: 'm21',
      title: '21. Storage & Inventory',
      desc: 'Warehouse and farm silo stock control, batch lot numbers, fumigation schedules, and eNWR receipts.',
      icon: Warehouse,
      href: '/inventory-storage',
      metric: 'Silo eNWR Pledges',
      status: 'Phase 7',
    },
    {
      id: 'm22',
      title: '22. Market Price Analysis',
      desc: 'Real-time mandi prices across Tamil Nadu APMCs, comparing spot auction bids with MSP.',
      icon: BarChart3,
      href: '/market-prices',
      metric: 'Agmarknet Bids',
      status: 'Phase 8',
    },
    {
      id: 'm23',
      title: '23. Buyer & Selling Management',
      desc: 'Direct farm-to-buyer marketplace, institutional FPO procurement contracts, and escrow payments.',
      icon: Handshake,
      href: '/buyer-selling',
      metric: 'Contract Sales',
      status: 'Phase 8',
    },
    {
      id: 'm24',
      title: '24. Transportation & Logistics',
      desc: 'Mandi transportation dispatch, vehicle booking, freight rate calculator per km, and driver tracking.',
      icon: Truck,
      href: '/logistics',
      metric: 'Freight Logistics',
      status: 'Phase 8',
    },
    {
      id: 'm25',
      title: '25. Cultivation Cost & Profit',
      desc: 'Complete agronomy accounting ledger calculating production cost vs gross revenue and net ROI.',
      icon: Coins,
      href: '/cultivation-pnl',
      metric: 'P&L Margins',
      status: 'Phase 8',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Executive Welcome Card */}
      <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/40 bg-white dark:bg-[#162218] p-5 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
              {user?.role || 'Farmer'} Command Center
            </span>
            <span className="text-xs text-[#687168] dark:text-[#9bb19f]">• Connected to MongoDB Atlas (`agri`)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#252B26] dark:text-white tracking-tight">
            Welcome, {user?.name || 'Farmer'}!
          </h1>
          <p className="text-xs sm:text-sm text-[#687168] dark:text-[#a0b5a3] mt-1.5 max-w-2xl leading-relaxed">
            Manage your complete agricultural workflow from farmer registration and land parcel
            mapping to automated soil intelligence and harvest marketing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href="/farmers/new"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white shadow-xs transition-colors shrink-0"
          >
            <span>+ Register Farmer</span>
          </Link>
          <Link
            href="/farms/new"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg border border-[#E3E8DF] dark:border-[#2d5c3a] bg-white dark:bg-[#1a2d20] hover:bg-[#F1F5EE] dark:hover:bg-[#223d2b] text-[#252B26] dark:text-[#E8F0E9] transition-colors shrink-0"
          >
            <span>+ Add Land Parcel</span>
          </Link>
          <Link
            href="/audit-logs"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg text-[#687168] dark:text-[#a0b5a3] hover:text-[#252B26] dark:hover:text-white hover:bg-[#F1F5EE] dark:hover:bg-[#1a2d20] transition-colors shrink-0"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* 3 Live Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-[#687168] dark:text-[#9bb19f] font-medium">Registered Farmers</span>
            <p className="text-3xl font-extrabold text-[#252B26] dark:text-white mt-1">{stats.farmersCount}</p>
            <Link
              href="/farmers"
              className="text-[11px] font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline flex items-center gap-1 mt-2"
            >
              <span>Manage Directory</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-[#687168] dark:text-[#9bb19f] font-medium">Mapped Land Parcels</span>
            <p className="text-3xl font-extrabold text-[#252B26] dark:text-white mt-1">{stats.farmsCount}</p>
            <Link
              href="/farms"
              className="text-[11px] font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline flex items-center gap-1 mt-2"
            >
              <span>View Survey Plots</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#F1F5EE] dark:bg-[#1b2d20] text-[#245C3A] dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Map className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1 transition-colors">
          <div>
            <span className="text-xs text-[#687168] dark:text-[#9bb19f] font-medium">Total Cultivable Area</span>
            <p className="text-3xl font-extrabold text-[#245C3A] dark:text-emerald-400 mt-1">
              {stats.cultivableAcres}{' '}
              <span className="text-sm font-semibold text-[#687168] dark:text-[#9bb19f]">Acres</span>
            </p>
            <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] flex items-center gap-1 mt-2">
              <CheckCircle2 className="h-3 w-3 text-[#245C3A] dark:text-emerald-400" />
              <span>Calibrated with ICAR Basal Norms</span>
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-emerald-300 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Modules Grid Navigation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#252B26] dark:text-white">
              Agricultural Intelligence Modules
            </h2>
            <p className="text-xs text-[#687168] dark:text-[#a0b5a3] mt-0.5">
              Click any module to inspect records, trigger AI analysis, or execute farming plans.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.id}
                href={m.href}
                className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs hover:border-[#245C3A] dark:hover:border-emerald-500/60 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-[#F1F5EE] dark:bg-[#1f3524] text-[#245C3A] dark:text-emerald-300 flex items-center justify-center group-hover:bg-[#E7EFE6] dark:group-hover:bg-[#27482f] transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FAFAF6] dark:bg-[#111913] text-[#687168] dark:text-[#9bb19f] border border-[#E3E8DF] dark:border-[#245C3A]/30">
                      {m.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#252B26] dark:text-white group-hover:text-[#245C3A] dark:group-hover:text-emerald-300 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-[#687168] dark:text-[#a0b5a3] mt-1.5 leading-relaxed">{m.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E3E8DF] dark:border-[#245C3A]/20 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#252B26] dark:text-[#d4e4d6]">{m.metric}</span>
                  <span className="text-[#245C3A] dark:text-emerald-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
