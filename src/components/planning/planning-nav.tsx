'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  ListTodo,
  Calendar,
  Layers,
  Sparkles,
  Tractor,
  ArrowRight,
  Clock,
  CheckCircle2,
  Wheat,
} from 'lucide-react';

export interface FarmerOption {
  _id: string;
  name: string;
  farmerCode: string;
  district?: string;
}

export interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: string | { _id: string; name?: string; farmerCode?: string };
  totalAreaAcres?: number;
  surveyNumber?: string;
}

export interface ActiveCropContext {
  cropName: string;
  varietyName: string;
  sowingDate: string;
  targetHarvestDate?: string;
  daysAfterSowing: number;
  totalDurationDays: number;
  growthStage: string;
  stageName: string;
  totalAreaAcres: number;
  parcelName: string;
  farmerName: string;
  farmerId?: string;
  farmId?: string;
  sowingId?: string;
}

interface PlanningNavProps {
  currentTab: 'lifecycle' | 'tasks';
  farmers: FarmerOption[];
  farms: FarmOption[];
  filterFarmerId: string;
  filterFarmId: string;
  onFarmerChange: (farmerId: string) => void;
  onFarmChange: (farmId: string) => void;
  onResetFilter: () => void;
  recordCount?: number;
  recordLabel?: string;
  cropName?: string;
  onActiveCropDetected?: (context: ActiveCropContext) => void;
}

export function PlanningNav({
  currentTab,
  farmers,
  farms,
  filterFarmerId,
  filterFarmId,
  onFarmerChange,
  onFarmChange,
  onResetFilter,
  recordCount,
  recordLabel = 'records',
  cropName,
  onActiveCropDetected,
}: PlanningNavProps) {
  const [activeCrop, setActiveCrop] = useState<ActiveCropContext | null>(null);
  const [cropLoading, setCropLoading] = useState(false);

  const onActiveCropDetectedRef = useRef(onActiveCropDetected);
  const farmsRef = useRef(farms);
  const farmersRef = useRef(farmers);
  const lastFetchedKeyRef = useRef<string>('');

  useEffect(() => {
    onActiveCropDetectedRef.current = onActiveCropDetected;
    farmsRef.current = farms;
    farmersRef.current = farmers;
  });

  const availableFarms = useMemo(() => {
    return farms.filter((fm) => {
      const fId = typeof fm.farmerId === 'object' ? fm.farmerId?._id : fm.farmerId;
      return !filterFarmerId || String(fId) === String(filterFarmerId);
    });
  }, [farms, filterFarmerId]);

  // Automatically select first farmer if none selected
  useEffect(() => {
    if (farmers.length > 0 && !filterFarmerId) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('crop360_planning_farmer') : null;
      const validStored = stored && farmers.some((f) => f._id === stored);
      const chosen = validStored ? (stored as string) : farmers[0]._id;
      onFarmerChange(chosen);
    }
  }, [farmers, filterFarmerId, onFarmerChange]);

  // Automatically select first available farm parcel when farmer is active
  useEffect(() => {
    if (availableFarms.length > 0 && !filterFarmId) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('crop360_planning_farm') : null;
      const validStored = stored && availableFarms.some((f) => f._id === stored);
      const chosen = validStored ? (stored as string) : availableFarms[0]._id;
      onFarmChange(chosen);
    }
  }, [availableFarms, filterFarmId, onFarmChange]);

  const handleFarmerSelect = (fId: string) => {
    if (typeof window !== 'undefined') {
      if (fId) localStorage.setItem('crop360_planning_farmer', fId);
      else localStorage.removeItem('crop360_planning_farmer');
    }
    onFarmerChange(fId);

    const matchingFarms = farms.filter((fm) => {
      const id = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
      return id === fId;
    });
    if (matchingFarms.length > 0) {
      onFarmChange(matchingFarms[0]._id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crop360_planning_farm', matchingFarms[0]._id);
      }
    }
  };

  const handleFarmSelect = (fmId: string) => {
    if (typeof window !== 'undefined') {
      if (fmId) localStorage.setItem('crop360_planning_farm', fmId);
      else localStorage.removeItem('crop360_planning_farm');
    }
    onFarmChange(fmId);
  };

  // Fetch active sowing record whenever farmId changes
  useEffect(() => {
    if (!filterFarmId) {
      setActiveCrop(null);
      lastFetchedKeyRef.current = '';
      return;
    }

    const currentKey = `${filterFarmId}_${filterFarmerId || ''}`;
    if (lastFetchedKeyRef.current === currentKey) {
      return;
    }
    lastFetchedKeyRef.current = currentKey;

    let isMounted = true;

    const fetchSowingContext = async () => {
      try {
        setCropLoading(true);
        const res = await fetch(`/api/sowing?farmId=${filterFarmId}`);
        if (!isMounted) return;

        if (res.ok) {
          const json = await res.json();
          const records = json.data || [];
          if (records.length > 0) {
            const latestSow = records[0];
            const now = new Date();
            const sowDate = latestSow.sowingDate ? new Date(latestSow.sowingDate) : now;
            const das = Math.max(0, Math.floor((now.getTime() - sowDate.getTime()) / (1000 * 60 * 60 * 24)));
            const duration = latestSow.totalDurationDays || 110;
            const targetHarvest = latestSow.targetHarvestDateEstimated
              ? new Date(latestSow.targetHarvestDateEstimated).toISOString().split('T')[0]
              : new Date(sowDate.getTime() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            let stage = 'vegetative';
            let stageName = 'Active Vegetative & Tillering';
            if (das <= 15) {
              stage = 'nursery';
              stageName = 'Nursery & Emergence';
            } else if (das <= 65) {
              stage = 'panicle';
              stageName = 'Panicle Initiation & Booting';
            } else if (das <= 90) {
              stage = 'flowering';
              stageName = 'Flowering & Grain Filling';
            } else {
              stage = 'maturity';
              stageName = 'Physiological Maturity & Harvest';
            }

            const currentFarm = farmsRef.current.find((f) => String(f._id) === String(filterFarmId));
            const currentFarmer = farmersRef.current.find((f) => String(f._id) === String(filterFarmerId));

            const ctx: ActiveCropContext = {
              cropName: latestSow.cropName,
              varietyName: latestSow.varietyName,
              sowingDate: latestSow.sowingDate,
              targetHarvestDate: targetHarvest,
              daysAfterSowing: das,
              totalDurationDays: duration,
              growthStage: stage,
              stageName,
              totalAreaAcres: currentFarm?.totalAreaAcres || 1,
              parcelName: currentFarm?.parcelName || 'Field Parcel',
              farmerName: currentFarmer?.name || 'Active Farmer',
              farmerId: filterFarmerId,
              farmId: filterFarmId,
              sowingId: latestSow._id,
            };

            setActiveCrop(ctx);
            if (onActiveCropDetectedRef.current) {
              onActiveCropDetectedRef.current(ctx);
            }
          } else {
            setActiveCrop(null);
          }
        }
      } catch (e) {
        console.warn('Planning context notice:', e);
      } finally {
        if (isMounted) {
          setCropLoading(false);
        }
      }
    };

    fetchSowingContext();

    return () => {
      isMounted = false;
    };
  }, [filterFarmId, filterFarmerId]);

  const queryParams = new URLSearchParams();
  if (filterFarmerId) queryParams.set('farmerId', filterFarmerId);
  if (filterFarmId) queryParams.set('farmId', filterFarmId);
  if (cropName || activeCrop?.cropName) {
    queryParams.set('cropName', cropName || activeCrop?.cropName || '');
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const tabs = [
    {
      id: 'lifecycle',
      label: 'Lifecycle Planner',
      step: '1',
      href: `/lifecycle-plans${queryString}`,
      icon: Target,
    },
    {
      id: 'tasks',
      label: 'Task & Schedule',
      step: '2',
      href: `/crop-tasks${queryString}`,
      icon: ListTodo,
    },
  ];

  return (
    <div className="space-y-3">
      {/* 2-Step Process Flow Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F4F7F2] dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/30 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#245C3A] text-white shadow-xs'
                  : 'text-[#687168] dark:text-[#a0b5a3] hover:text-[#252B26] dark:hover:text-white hover:bg-white/60 dark:hover:bg-stone-800/40'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}
              >
                {tab.step}
              </span>
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        <div className="ml-auto hidden md:flex items-center gap-2 pr-2">
          <Link
            href={`/harvest-readiness${queryString}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline"
          >
            <span>Proceed to Harvest Operations</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Unified Farmer & Land Parcel Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#245C3A] dark:text-emerald-400 shrink-0">
            <Layers className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
            <span className="uppercase tracking-wider text-[11px]">Select Active Farm:</span>
          </div>

          {/* Farmer Dropdown */}
          <select
            value={filterFarmerId}
            onChange={(e) => handleFarmerSelect(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-[#FBFDFB] dark:bg-[#121c14] text-[#252B26] dark:text-stone-100 font-medium focus:outline-none focus:border-[#245C3A] transition"
          >
            <option value="">All Registered Farmers ({farmers.length})</option>
            {farmers.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} ({f.farmerCode})
              </option>
            ))}
          </select>

          {/* Land Parcel Dropdown */}
          <select
            value={filterFarmId}
            onChange={(e) => handleFarmSelect(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-[#FBFDFB] dark:bg-[#121c14] text-[#252B26] dark:text-stone-100 font-medium focus:outline-none focus:border-[#245C3A] transition"
          >
            <option value="">
              {!filterFarmerId ? 'All Farm Parcels' : availableFarms.length ? 'All Parcels for Farmer' : 'No Parcels Added'}
            </option>
            {availableFarms.map((fm) => (
              <option key={fm._id} value={fm._id}>
                {fm.parcelName} ({fm.totalAreaAcres || 1} ac)
              </option>
            ))}
          </select>

          {(filterFarmerId || filterFarmId) && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('crop360_planning_farmer');
                  localStorage.removeItem('crop360_planning_farm');
                }
                onResetFilter();
              }}
              className="text-[11px] text-[#687168] dark:text-stone-400 hover:text-rose-600 transition underline underline-offset-2"
            >
              Reset
            </button>
          )}
        </div>

        {recordCount !== undefined && (
          <div className="text-[11px] text-[#687168] dark:text-[#a0b5a3] font-medium shrink-0 self-end sm:self-center">
            Showing <strong className="text-[#252B26] dark:text-white font-bold">{recordCount}</strong> {recordLabel}
          </div>
        )}
      </div>

      {/* Active Crop Cultivation Context Banner */}
      {activeCrop && (
        <div className="relative overflow-hidden rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-gradient-to-r from-emerald-50 via-[#F4F9F4] to-teal-50 dark:from-[#132819] dark:via-[#16291b] dark:to-[#102417] p-3 sm:p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Target className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                    Active Lifecycle Track
                  </span>
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    {activeCrop.cropName} • {activeCrop.varietyName}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    ({activeCrop.parcelName} • {activeCrop.totalAreaAcres} Acres)
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-600 dark:text-stone-300 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <strong>DAS {activeCrop.daysAfterSowing}</strong> / {activeCrop.totalDurationDays} Days
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">•</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Current Phase: {activeCrop.stageName}
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">•</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Target Harvest: <strong>{activeCrop.targetHarvestDate}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <Link
                href={`/crop-tasks${queryString}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition"
              >
                <ListTodo className="h-3.5 w-3.5" />
                <span>Schedule Labor Tasks</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
