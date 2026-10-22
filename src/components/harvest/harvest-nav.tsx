'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Timer,
  Tractor,
  Sun,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Gauge,
  CheckCircle2,
  Wheat,
  Droplets,
  DollarSign,
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

export interface ActiveHarvestContext {
  cropName: string;
  varietyName: string;
  sowingDate?: string;
  optimalHarvestStartDate: string;
  optimalHarvestEndDate: string;
  accumulatedGDD: number;
  grainMoisturePercent: number;
  visualMaturityIndexPercent: number;
  predictedYieldQuintalsPerAcre: number;
  totalEstimatedYieldQuintals: number;
  totalAreaAcres: number;
  parcelName: string;
  farmerName: string;
  farmerId?: string;
  farmId?: string;
}

interface HarvestNavProps {
  currentTab: 'readiness' | 'operations' | 'post-harvest' | 'storage';
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
  onActiveHarvestDetected?: (context: ActiveHarvestContext) => void;
}

export function HarvestNav({
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
  onActiveHarvestDetected,
}: HarvestNavProps) {
  const [activeHarvest, setActiveHarvest] = useState<ActiveHarvestContext | null>(null);
  const [harvestLoading, setHarvestLoading] = useState(false);

  const onActiveHarvestDetectedRef = useRef(onActiveHarvestDetected);
  const farmsRef = useRef(farms);
  const farmersRef = useRef(farmers);
  const lastFetchedKeyRef = useRef<string>('');

  useEffect(() => {
    onActiveHarvestDetectedRef.current = onActiveHarvestDetected;
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
      const stored = typeof window !== 'undefined' ? localStorage.getItem('crop360_harvest_farmer') : null;
      const validStored = stored && farmers.some((f) => f._id === stored);
      const chosen = validStored ? (stored as string) : farmers[0]._id;
      onFarmerChange(chosen);
    }
  }, [farmers, filterFarmerId, onFarmerChange]);

  // Automatically select first available farm parcel when farmer is active
  useEffect(() => {
    if (availableFarms.length > 0 && !filterFarmId) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('crop360_harvest_farm') : null;
      const validStored = stored && availableFarms.some((f) => f._id === stored);
      const chosen = validStored ? (stored as string) : availableFarms[0]._id;
      onFarmChange(chosen);
    }
  }, [availableFarms, filterFarmId, onFarmChange]);

  const handleFarmerSelect = (fId: string) => {
    if (typeof window !== 'undefined') {
      if (fId) localStorage.setItem('crop360_harvest_farmer', fId);
      else localStorage.removeItem('crop360_harvest_farmer');
    }
    onFarmerChange(fId);

    const matchingFarms = farms.filter((fm) => {
      const id = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
      return id === fId;
    });
    if (matchingFarms.length > 0) {
      onFarmChange(matchingFarms[0]._id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crop360_harvest_farm', matchingFarms[0]._id);
      }
    }
  };

  const handleFarmSelect = (fmId: string) => {
    if (typeof window !== 'undefined') {
      if (fmId) localStorage.setItem('crop360_harvest_farm', fmId);
      else localStorage.removeItem('crop360_harvest_farm');
    }
    onFarmChange(fmId);
  };

  // Fetch active sowing and harvest context
  useEffect(() => {
    if (!filterFarmId) {
      setActiveHarvest(null);
      lastFetchedKeyRef.current = '';
      return;
    }

    const currentKey = `${filterFarmId}_${filterFarmerId || ''}`;
    if (lastFetchedKeyRef.current === currentKey) {
      return;
    }
    lastFetchedKeyRef.current = currentKey;

    let isMounted = true;

    const fetchHarvestContext = async () => {
      try {
        setHarvestLoading(true);
        const [sowRes, predRes] = await Promise.all([
          fetch(`/api/sowing?farmId=${filterFarmId}`),
          fetch(`/api/harvest-prediction?farmId=${filterFarmId}`),
        ]);
        if (!isMounted) return;

        let crop = 'Paddy / Rice';
        let variety = 'CR 1009 Sub 1';
        let sowDateStr: string | undefined = undefined;

        if (sowRes.ok) {
          const sowJson = await sowRes.json();
          if (sowJson.data?.length > 0) {
            crop = sowJson.data[0].cropName || crop;
            variety = sowJson.data[0].varietyName || variety;
            sowDateStr = sowJson.data[0].sowingDate;
          }
        }

        const currentFarm = farmsRef.current.find((f) => String(f._id) === String(filterFarmId));
        const currentFarmer = farmersRef.current.find((f) => String(f._id) === String(filterFarmerId));
        const area = currentFarm?.totalAreaAcres || 1;

        let gdd = 1980;
        let moisture = 19.2;
        let visualMaturity = 88;
        let yieldPerAcre = 26.5;
        let startDate = new Date().toISOString().split('T')[0];
        let endDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        if (predRes.ok) {
          const predJson = await predRes.json();
          if (predJson.data?.length > 0) {
            const latestPred = predJson.data[0];
            gdd = latestPred.accumulatedGDD || gdd;
            moisture = latestPred.grainMoisturePercent || moisture;
            visualMaturity = latestPred.visualMaturityIndexPercent || visualMaturity;
            yieldPerAcre = latestPred.predictedYieldQuintalsPerAcre || yieldPerAcre;
            if (latestPred.optimalHarvestStartDate) {
              startDate = new Date(latestPred.optimalHarvestStartDate).toISOString().split('T')[0];
            }
            if (latestPred.optimalHarvestEndDate) {
              endDate = new Date(latestPred.optimalHarvestEndDate).toISOString().split('T')[0];
            }
          }
        }

        const ctx: ActiveHarvestContext = {
          cropName: crop,
          varietyName: variety,
          sowingDate: sowDateStr,
          optimalHarvestStartDate: startDate,
          optimalHarvestEndDate: endDate,
          accumulatedGDD: gdd,
          grainMoisturePercent: moisture,
          visualMaturityIndexPercent: visualMaturity,
          predictedYieldQuintalsPerAcre: yieldPerAcre,
          totalEstimatedYieldQuintals: Math.round(yieldPerAcre * area * 10) / 10,
          totalAreaAcres: area,
          parcelName: currentFarm?.parcelName || 'Field Parcel',
          farmerName: currentFarmer?.name || 'Active Farmer',
          farmerId: filterFarmerId,
          farmId: filterFarmId,
        };

        setActiveHarvest(ctx);
        if (onActiveHarvestDetectedRef.current) {
          onActiveHarvestDetectedRef.current(ctx);
        }
      } catch (e) {
        console.warn('Harvest context notice:', e);
      } finally {
        if (isMounted) {
          setHarvestLoading(false);
        }
      }
    };

    fetchHarvestContext();

    return () => {
      isMounted = false;
    };
  }, [filterFarmId, filterFarmerId]);

  const queryParams = new URLSearchParams();
  if (filterFarmerId) queryParams.set('farmerId', filterFarmerId);
  if (filterFarmId) queryParams.set('farmId', filterFarmId);
  if (cropName || activeHarvest?.cropName) {
    queryParams.set('cropName', cropName || activeHarvest?.cropName || '');
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const tabs = [
    {
      id: 'readiness',
      label: 'Harvest Readiness',
      step: '1',
      href: `/harvest-readiness${queryString}`,
      icon: Timer,
    },
    {
      id: 'operations',
      label: 'Harvest Operations',
      step: '2',
      href: `/harvest-management${queryString}`,
      icon: Tractor,
    },
    {
      id: 'post-harvest',
      label: 'Post-Harvest & QC',
      step: '3',
      href: `/post-harvest${queryString}`,
      icon: Sun,
    },
  ];

  return (
    <div className="space-y-3">
      {/* 3-Step Process Flow Tabs */}
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
            href={`/market-prices${queryString}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline"
          >
            <span>Proceed to Mandi Market Prices</span>
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
                  localStorage.removeItem('crop360_harvest_farmer');
                  localStorage.removeItem('crop360_harvest_farm');
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

      {/* Active Harvest & Grain Yield Context Banner */}
      {activeHarvest && (
        <div className="relative overflow-hidden rounded-xl border border-amber-300 dark:border-amber-800/60 bg-gradient-to-r from-amber-50 via-[#FAF7F0] to-emerald-50 dark:from-[#211d13] dark:via-[#1e1c15] dark:to-[#122217] p-3 sm:p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-600/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Wheat className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-2xs">
                    Harvest &amp; Grain Yield Track
                  </span>
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    {activeHarvest.cropName} • {activeHarvest.varietyName}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    ({activeHarvest.parcelName} • {activeHarvest.totalAreaAcres} Acres)
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-600 dark:text-stone-300 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <Droplets className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Moisture: <strong>{activeHarvest.grainMoisturePercent}%</strong>
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Gauge className="h-3.5 w-3.5 text-amber-600" />
                    Maturity Index: <strong>{activeHarvest.visualMaturityIndexPercent}%</strong>
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">•</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Est. Yield: <strong>{activeHarvest.totalEstimatedYieldQuintals} Quintals</strong> ({activeHarvest.predictedYieldQuintalsPerAcre} q/ac)
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">•</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Window: <strong>{activeHarvest.optimalHarvestStartDate}</strong> to <strong>{activeHarvest.optimalHarvestEndDate}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {currentTab === 'readiness' && (
                <Link
                  href={`/harvest-management${queryString}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition"
                >
                  <Tractor className="h-3.5 w-3.5" />
                  <span>Start Combine Harvest</span>
                </Link>
              )}
              {currentTab === 'operations' && (
                <Link
                  href={`/post-harvest${queryString}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition"
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Log Tarpaulin Drying &amp; QC</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
