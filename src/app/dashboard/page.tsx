'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Map,
  Sprout,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Search,
  Layers,
  MapPin,
  RefreshCw,
  FileSpreadsheet,
  Cpu,
  FileCheck2,
  Wheat,
  Tractor,
  Package,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { SafeUser } from '@/types';

interface SowingItem {
  _id: string;
  cropName: string;
  varietyName: string;
  sowingDate: string;
  plantingMethod?: string;
  status: 'planned' | 'sown' | 'germination_verified' | 'failed_resown';
  farmerId?: { _id: string; name: string; farmerCode: string };
  farmId?: { _id: string; parcelName: string; totalAreaAcres: number; soilType: string };
}

interface SeedItem {
  _id: string;
  cropName: string;
  varietyName: string;
  category: string;
  stockAvailableKg: number;
  germinationRateMinPercent: number;
  certificationAgency?: string;
}

interface SoilReportItem {
  _id: string;
  sampleCode: string;
  testDate: string;
  pH: number;
  organicCarbonPercent: number;
  nitrogenKgPerHa: number;
  phosphorusKgPerHa: number;
  potassiumKgPerHa: number;
  status?: string;
  farmerId?: { _id: string; name: string };
  farmId?: { _id: string; parcelName: string };
}

interface SoilCardItem {
  _id: string;
  cardCode?: string;
  overallSoilHealthRating?: string;
  issueDate?: string;
  farmerId?: { _id: string; name: string; farmerCode: string };
  farmId?: { _id: string; parcelName: string; totalAreaAcres: number; soilType: string };
  reportId?: { _id: string; sampleCode: string };
}

interface LandPrepItem {
  _id: string;
  cropName: string;
  tillageType: string;
  status: string;
  farmerId?: { _id: string; name: string };
  farmId?: { _id: string; parcelName: string };
}

export default function DashboardPage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Modules Operational Data States
  const [farmers, setFarmers] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [soilReports, setSoilReports] = useState<SoilReportItem[]>([]);
  const [soilCards, setSoilCards] = useState<SoilCardItem[]>([]);
  const [landPreps, setLandPreps] = useState<LandPrepItem[]>([]);
  const [sowings, setSowings] = useState<SowingItem[]>([]);

  // Interactive Filter
  const [parcelSearch, setParcelSearch] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        meRes,
        farmersRes,
        farmsRes,
        seedsRes,
        soilReportsRes,
        soilCardsRes,
        landPrepRes,
        sowingRes,
      ] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/farmers'),
        fetch('/api/farms'),
        fetch('/api/seed-catalog'),
        fetch('/api/soil-reports'),
        fetch('/api/soil-cards'),
        fetch('/api/land-prep'),
        fetch('/api/sowing'),
      ]);

      if (meRes.ok) {
        const json = await meRes.json();
        setUser(json.data);
      }
      if (farmersRes.ok) {
        const json = await farmersRes.json();
        setFarmers(json.data || []);
      }
      if (farmsRes.ok) {
        const json = await farmsRes.json();
        setFarms(json.data || []);
      }
      if (seedsRes.ok) {
        const json = await seedsRes.json();
        setSeeds(json.data || []);
      }
      if (soilReportsRes.ok) {
        const json = await soilReportsRes.json();
        setSoilReports(json.data || []);
      }
      if (soilCardsRes.ok) {
        const json = await soilCardsRes.json();
        setSoilCards(json.data || []);
      }
      if (landPrepRes.ok) {
        const json = await landPrepRes.json();
        setLandPreps(json.data || []);
      }
      if (sowingRes.ok) {
        const json = await sowingRes.json();
        setSowings(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard active operational data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Computed Real-time Metrics
  const totalCultivableAcres = useMemo(() => {
    const total = farms.reduce(
      (acc, f) => acc + (Number(f.cultivableAreaAcres) || Number(f.totalAreaAcres) || 0),
      0
    );
    return Math.round(total * 10) / 10;
  }, [farms]);

  const activeSownCount = useMemo(() => {
    return sowings.filter((s) => s.status === 'sown' || s.status === 'germination_verified').length;
  }, [sowings]);

  const plannedSowCount = useMemo(() => {
    return sowings.filter((s) => s.status === 'planned').length;
  }, [sowings]);

  const avgGerminationRate = useMemo(() => {
    if (!seeds.length) return 85;
    const total = seeds.reduce((acc, s) => acc + (Number(s.germinationRateMinPercent) || 85), 0);
    return Math.round(total / seeds.length);
  }, [seeds]);

  const avgSoilPH = useMemo(() => {
    if (!soilReports.length) return 6.8;
    const total = soilReports.reduce((acc, r) => acc + (Number(r.pH) || 7), 0);
    return Math.round((total / soilReports.length) * 10) / 10;
  }, [soilReports]);

  // Combined Active Land Parcel Rows for Table
  const activeParcelRows = useMemo(() => {
    return farms.map((farm) => {
      const fId = typeof farm.farmerId === 'object' ? farm.farmerId?._id : farm.farmerId;
      const farmerObj = farmers.find((f) => String(f._id) === String(fId));
      
      const sowObj = sowings.find((s) => {
        const sFarmId = typeof s.farmId === 'object' ? s.farmId?._id : s.farmId;
        return String(sFarmId) === String(farm._id);
      });

      const soilReportObj = soilReports.find((r) => {
        const rFarmId = typeof r.farmId === 'object' ? r.farmId?._id : r.farmId;
        return String(rFarmId) === String(farm._id);
      });

      const soilCardObj = soilCards.find((c) => {
        const cFarmId = typeof c.farmId === 'object' ? c.farmId?._id : c.farmId;
        return String(cFarmId) === String(farm._id);
      });

      const landPrepObj = landPreps.find((p) => {
        const pFarmId = typeof p.farmId === 'object' ? p.farmId?._id : p.farmId;
        return String(pFarmId) === String(farm._id);
      });

      const now = new Date();
      const sowDate = sowObj?.sowingDate ? new Date(sowObj.sowingDate) : null;
      const das = sowDate
        ? Math.max(0, Math.floor((now.getTime() - sowDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        farmId: farm._id,
        parcelName: farm.parcelName,
        surveyNumber: farm.surveyNumber || '-',
        totalAreaAcres: farm.totalAreaAcres || farm.cultivableAreaAcres || 0,
        soilType: farm.soilType || 'Loamy',
        farmerId: fId,
        farmerName: farmerObj?.name || 'Unassigned Farmer',
        farmerCode: farmerObj?.farmerCode || '-',
        // Sowing Lifecycle
        isSown: sowObj ? (sowObj.status === 'sown' || sowObj.status === 'germination_verified') : false,
        sowStatus: sowObj?.status || 'unplanned',
        cropName: sowObj?.cropName || (landPrepObj?.cropName || 'Awaiting Crop Plan'),
        varietyName: sowObj?.varietyName || 'Standard',
        sowingDate: sowDate ? sowDate.toISOString() : null,
        das,
        // Soil Intelligence
        hasSoilReport: Boolean(soilReportObj),
        soilReportSample: soilReportObj?.sampleCode,
        soilPH: soilReportObj?.pH,
        hasSoilCard: Boolean(soilCardObj),
        soilHealthRating: soilCardObj?.overallSoilHealthRating || 'Good',
        // Land Prep
        hasLandPrep: Boolean(landPrepObj),
        landPrepStatus: landPrepObj?.status || (sowObj ? 'Completed' : 'Pending'),
        tillageType: landPrepObj?.tillageType || 'Conventional',
      };
    });
  }, [farms, farmers, sowings, soilReports, soilCards, landPreps]);

  const filteredParcelRows = useMemo(() => {
    if (!parcelSearch.trim()) return activeParcelRows;
    const term = parcelSearch.toLowerCase();
    return activeParcelRows.filter(
      (r) =>
        r.parcelName.toLowerCase().includes(term) ||
        r.cropName.toLowerCase().includes(term) ||
        r.farmerName.toLowerCase().includes(term) ||
        r.varietyName.toLowerCase().includes(term) ||
        r.soilType.toLowerCase().includes(term)
    );
  }, [activeParcelRows, parcelSearch]);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Executive Command Header */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#162218] p-6 sm:p-7 shadow-xs">
        {/* Subtle decorative gradient top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#245C3A] to-teal-600" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#245C3A] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {todayFormatted}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                <Sprout className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Samba Season (Late Kharif / Rabi)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                <MapPin className="w-3.5 h-3.5 text-[#245C3A] dark:text-emerald-400" />
                {farms.length} Parcels ({totalCultivableAcres} ac)
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                Welcome back, {user?.name || user?.email?.split('@')[0] || 'Farmer'}!
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
                Centralized agronomy command for farmer profiles, soil intelligence, certified seed catalog, and cultivation lifecycle.
              </p>
            </div>
          </div>

          {/* Active Modules Quick Action Group */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/sowing"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#245C3A] hover:bg-[#1c482d] text-white shadow-xs transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            >
              <Sprout className="h-4 w-4 text-emerald-200" />
              <span>Plan Sowing</span>
            </Link>
            <Link
              href="/soil-analysis"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            >
              <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>AI Soil Analysis</span>
            </Link>
            <Link
              href="/farms/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            >
              <Map className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
              <span>+ Register Parcel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5 Core Agronomy Intelligence KPI Cards (Aligned with Active Sidebar Modules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-4.5">
        {/* Card 1: Farmer Management */}
        <Link
          href="/farmers"
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#162218] p-5 shadow-xs hover:border-[#245C3A] hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-stone-500 dark:text-stone-400">
              Farmers
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#245C3A] dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {farmers.length}
              </span>
              <span className="text-xs font-bold text-stone-500">Registered</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active FPO Members</span>
            </div>
          </div>
        </Link>

        {/* Card 2: Farmland & Land Parcels */}
        <Link
          href="/farms"
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#162218] p-5 shadow-xs hover:border-[#245C3A] hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-stone-500 dark:text-stone-400">
              Land Portfolio
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#245C3A] dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Map className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {totalCultivableAcres}
              </span>
              <span className="text-xs font-bold text-stone-500">Acres</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{farms.length} Surveyed Parcels</span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="text-stone-500 font-normal">100% Ready</span>
            </div>
          </div>
        </Link>

        {/* Card 3: Seed Catalog & Stock */}
        <Link
          href="/seed-catalog"
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#162218] p-5 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-stone-500 dark:text-stone-400">
              Seed Catalog
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {seeds.length || '12+'}
              </span>
              <span className="text-xs font-bold text-stone-500">Varieties</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-teal-700 dark:text-teal-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{avgGerminationRate}% Avg Germination</span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="text-stone-500 font-normal">Certified</span>
            </div>
          </div>
        </Link>

        {/* Card 4: Soil Health Intelligence */}
        <Link
          href="/soil-cards"
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#162218] p-5 shadow-xs hover:border-blue-500 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-stone-500 dark:text-stone-400">
              Soil Intelligence
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {soilCards.length || soilReports.length}
              </span>
              <span className="text-xs font-bold text-stone-500">Cards Issued</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>pH {avgSoilPH} (Neutral)</span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="text-stone-500 font-normal">NPK Tested</span>
            </div>
          </div>
        </Link>

        {/* Card 5: Cultivation & Sowing Lifecycle */}
        <Link
          href="/sowing"
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#162218] p-5 shadow-xs hover:border-amber-500 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-stone-500 dark:text-stone-400">
              Sowing Lifecycle
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {activeSownCount}
              </span>
              <span className="text-xs font-bold text-stone-500">
                {activeSownCount === 1 ? 'Parcel Sown' : 'Parcels Sown'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Tractor className="w-3.5 h-3.5 text-amber-600" />
              <span>{plannedSowCount} Planned</span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="text-stone-500 font-normal">Harvest Tracked</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Live Field Parcels & Cultivation Command Table */}
      <div className="rounded-3xl border border-[#245C3A]/20 bg-white dark:bg-[#162218] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#245C3A]" />
              Live Farm Parcels &amp; Cultivation Status
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Real-time synchronization across registered farmers, soil parcels, land preparation, and sowing operations.
            </p>
          </div>

          {/* Search Filter */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Filter by parcel, crop, or farmer..."
              value={parcelSearch}
              onChange={(e) => setParcelSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <th className="py-3 px-3">Land Parcel &amp; Farmer</th>
                <th className="py-3 px-3">Soil Intelligence</th>
                <th className="py-3 px-3">Land Preparation</th>
                <th className="py-3 px-3">Active Crop &amp; Variety</th>
                <th className="py-3 px-3">Sowing Timeline</th>
                <th className="py-3 px-3">Lifecycle Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
              {filteredParcelRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    No matching farm parcels found.
                  </td>
                </tr>
              ) : (
                filteredParcelRows.map((row) => (
                  <tr key={row.farmId} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition">
                    {/* 1. Parcel & Farmer */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-stone-900 dark:text-white">{row.parcelName}</div>
                      <div className="text-[11px] text-stone-500">
                        {row.farmerName} • <strong className="text-emerald-700 dark:text-emerald-400">{row.totalAreaAcres} ac</strong>
                      </div>
                    </td>

                    {/* 2. Soil Intelligence */}
                    <td className="py-3.5 px-3">
                      <div className="text-stone-800 dark:text-stone-200 font-semibold">
                        {row.soilType}
                      </div>
                      {row.hasSoilCard ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Health Card Issued
                        </span>
                      ) : row.hasSoilReport ? (
                        <span className="inline-block text-[10px] text-teal-600 dark:text-teal-400">
                          Sample #{row.soilReportSample} (pH {row.soilPH || '7.0'})
                        </span>
                      ) : (
                        <Link
                          href={`/soil-reports?farmerId=${row.farmerId}&farmId=${row.farmId}`}
                          className="text-[10px] text-stone-400 hover:text-[#245C3A] hover:underline"
                        >
                          + Add Soil Test
                        </Link>
                      )}
                    </td>

                    {/* 3. Land Preparation */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        <Tractor className="w-3 h-3 text-[#245C3A] dark:text-emerald-400" />
                        {row.tillageType}
                      </span>
                    </td>

                    {/* 4. Active Crop & Variety */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#245C3A] dark:text-emerald-300">{row.cropName}</div>
                      {row.isSown ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 mt-0.5">
                          {row.varietyName}
                        </span>
                      ) : (
                        <Link
                          href={`/sowing?farmerId=${row.farmerId}&farmId=${row.farmId}`}
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 hover:underline mt-0.5"
                        >
                          + Plant Crop
                        </Link>
                      )}
                    </td>

                    {/* 5. Sowing Timeline */}
                    <td className="py-3.5 px-3">
                      {row.sowingDate ? (
                        <>
                          <div className="text-stone-800 dark:text-stone-200">
                            {new Date(row.sowingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            Day {row.das} (DAS)
                          </div>
                        </>
                      ) : (
                        <span className="text-stone-400 text-[11px] italic">Not sown</span>
                      )}
                    </td>

                    {/* 6. Lifecycle Status */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        row.sowStatus === 'germination_verified'
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
                          : row.sowStatus === 'sown'
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                          : row.sowStatus === 'planned'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {row.sowStatus.replace('_', ' ')}
                      </span>
                    </td>

                    {/* 7. Active Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/soil-cards?farmerId=${row.farmerId}&farmId=${row.farmId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[11px] font-medium transition cursor-pointer"
                          title="View Soil Health Card"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>Soil Card</span>
                        </Link>
                        <Link
                          href={`/land-prep?farmerId=${row.farmerId}&farmId=${row.farmId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-[11px] font-medium transition cursor-pointer"
                          title="Prepare Land"
                        >
                          <Tractor className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Land Prep</span>
                        </Link>
                        <Link
                          href={`/sowing?farmerId=${row.farmerId}&farmId=${row.farmId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-medium transition cursor-pointer"
                          title="Sowing & Planting"
                        >
                          <Sprout className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Sow</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Active Domain Hub: Soil Intelligence & Cultivation Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hub 1: Soil Intelligence Laboratory */}
        <div className="rounded-3xl border border-[#245C3A]/20 bg-gradient-to-br from-white to-emerald-50/30 dark:from-[#162218] dark:to-emerald-950/20 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Soil Intelligence &amp; Health Cards
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Laboratory chemical analysis, N-P-K nutrient status &amp; AI fertility rating.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3 h-3 text-blue-600" />
                AI Analyzed
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 my-3 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                  Test Reports
                </span>
                <span className="font-bold text-stone-800 dark:text-stone-200 text-base">
                  {soilReports.length} Samples
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                  Health Cards
                </span>
                <span className="font-bold text-blue-700 dark:text-blue-400 text-base">
                  {soilCards.length} Issued
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                  Avg pH Value
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base font-mono">
                  {avgSoilPH} (Optimal)
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mt-2">
              Soil Health Cards provide customized dosage guidelines for organic manure, biofertilizers, and macro-nutrients tailored to Tamil Nadu agro-climatic zones.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs">
            <Link
              href="/soil-cards"
              className="font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              <span>View All Soil Health Cards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/soil-analysis"
              className="font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline flex items-center gap-1.5"
            >
              <span>Run AI Soil Analysis →</span>
            </Link>
          </div>
        </div>

        {/* Hub 2: Cultivation Lifecycle Pipeline */}
        <div className="rounded-3xl border border-[#245C3A]/20 bg-gradient-to-br from-white to-amber-50/30 dark:from-[#162218] dark:to-amber-950/20 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Wheat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Cultivation Lifecycle Pipeline
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Step-by-step field progression from crop suitability to land prep and sowing.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Sprout className="w-3 h-3 text-amber-600" />
                Season Active
              </span>
            </div>

            {/* 3 Step Pipeline Progress */}
            <div className="space-y-2.5 my-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">Crop Suitability</span>
                </div>
                <Link
                  href="/crop-suitability"
                  className="text-[11px] font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline"
                >
                  Suitability Matrix →
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">Land Preparation</span>
                </div>
                <Link
                  href="/land-prep"
                  className="text-[11px] font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline"
                >
                  Tillage Plans →
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">Sowing &amp; Planting</span>
                </div>
                <Link
                  href="/sowing"
                  className="text-[11px] font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline"
                >
                  {activeSownCount} Sown • {plannedSowCount} Planned →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs">
            <Link
              href="/seed-catalog"
              className="font-semibold text-stone-600 dark:text-stone-300 hover:text-[#245C3A] hover:underline flex items-center gap-1.5"
            >
              <span>Certified Seed Varieties</span>
              <Package className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/sowing"
              className="font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1.5"
            >
              <span>Manage Sowing Operations →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
