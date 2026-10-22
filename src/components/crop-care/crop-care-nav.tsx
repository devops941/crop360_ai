'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Droplet,
  FlaskConical,
  Bug,
  ShieldCheck,
  CloudSun,
  Filter,
  Sprout,
  Calendar,
  CheckCircle2,
  Sparkles,
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
  irrigationSource?: string;
  soilType?: string;
}

export interface ActiveCropContext {
  cropName: string;
  varietyName: string;
  sowingDate: string;
  daysAfterSowing: number;
  growthStage: string;
  stageName: string;
  plantingMethod: string;
  plantHeightCm: number;
  canopyCoveragePercent: number;
  tillerCountPerPlant: number;
  totalAreaAcres: number;
  parcelName: string;
  farmerName: string;
  farmerId?: string;
  farmId?: string;
  sowingId?: string;
}

export function calculateCropBiometrics(sowingDateStr?: string) {
  const now = new Date();
  const sowDate = sowingDateStr ? new Date(sowingDateStr) : now;
  const das = Math.max(0, Math.floor((now.getTime() - sowDate.getTime()) / (1000 * 60 * 60 * 24)));

  let stage = 'vegetative';
  let stageName = 'Active Vegetative';
  let plantHeightCm = 35;
  let canopyCoveragePercent = 50;
  let tillerCountPerPlant = 8;

  if (das <= 15) {
    stage = 'seedling';
    stageName = 'Seedling Emergence';
    plantHeightCm = 15;
    canopyCoveragePercent = 25;
    tillerCountPerPlant = 3;
  } else if (das <= 35) {
    stage = 'vegetative';
    stageName = 'Active Vegetative';
    plantHeightCm = 35;
    canopyCoveragePercent = 50;
    tillerCountPerPlant = 8;
  } else if (das <= 65) {
    stage = 'tillering';
    stageName = 'Active Tillering';
    plantHeightCm = 55;
    canopyCoveragePercent = 75;
    tillerCountPerPlant = 16;
  } else if (das <= 85) {
    stage = 'flowering';
    stageName = 'Panicle Initiation & Flowering';
    plantHeightCm = 80;
    canopyCoveragePercent = 88;
    tillerCountPerPlant = 18;
  } else if (das <= 105) {
    stage = 'grain_filling';
    stageName = 'Grain Filling / Milking';
    plantHeightCm = 85;
    canopyCoveragePercent = 90;
    tillerCountPerPlant = 18;
  } else {
    stage = 'maturity';
    stageName = 'Physiological Maturity';
    plantHeightCm = 88;
    canopyCoveragePercent = 85;
    tillerCountPerPlant = 18;
  }

  return { das, stage, stageName, plantHeightCm, canopyCoveragePercent, tillerCountPerPlant };
}

interface CropCareNavProps {
  currentTab: 'growth' | 'irrigation' | 'nutrients' | 'pest' | 'protection' | 'weather';
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

export function CropCareNav({
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
}: CropCareNavProps) {
  const [activeCrop, setActiveCrop] = useState<ActiveCropContext | null>(null);
  const [cropLoading, setCropLoading] = useState(false);

  // Keep callbacks and array props in refs to break unwanted re-render loops
  const onActiveCropDetectedRef = useRef(onActiveCropDetected);
  const onFarmerChangeRef = useRef(onFarmerChange);
  const onFarmChangeRef = useRef(onFarmChange);
  const farmsRef = useRef(farms);
  const farmersRef = useRef(farmers);
  const lastFetchedKeyRef = useRef<string>('');

  useEffect(() => {
    onActiveCropDetectedRef.current = onActiveCropDetected;
    onFarmerChangeRef.current = onFarmerChange;
    onFarmChangeRef.current = onFarmChange;
    farmsRef.current = farms;
    farmersRef.current = farmers;
  });

  // Farms filtered for the current farmer (memoized to avoid new array reference on each render)
  const availableFarms = useMemo(() => {
    return farms.filter((fm) => {
      const fId = typeof fm.farmerId === 'object' ? fm.farmerId?._id : fm.farmerId;
      return !filterFarmerId || String(fId) === String(filterFarmerId);
    });
  }, [farms, filterFarmerId]);

  // Automatically select first farmer if none selected
  useEffect(() => {
    if (farmers.length > 0 && !filterFarmerId) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('crop360_care_farmer') : null;
      const validStored = stored && farmers.some((f) => String(f._id) === String(stored));
      const chosen = validStored ? (stored as string) : farmers[0]._id;
      onFarmerChangeRef.current(chosen);
    }
  }, [farmers.length, filterFarmerId]);

  // Synchronize farm parcel with selected farmer:
  // Whenever availableFarms changes, ensure filterFarmId belongs to this farmer's farms!
  useEffect(() => {
    if (availableFarms.length > 0) {
      const belongs = availableFarms.some((f) => String(f._id) === String(filterFarmId));
      if (!belongs) {
        const chosen = availableFarms[0]._id;
        onFarmChangeRef.current(chosen);
        if (typeof window !== 'undefined') {
          localStorage.setItem('crop360_care_farm', chosen);
        }
      }
    } else if (filterFarmerId && availableFarms.length === 0 && filterFarmId) {
      onFarmChangeRef.current('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('crop360_care_farm');
      }
    }
  }, [availableFarms, filterFarmId, filterFarmerId]);

  // Persist selections
  const handleFarmerSelect = (fId: string) => {
    if (typeof window !== 'undefined') {
      if (fId) localStorage.setItem('crop360_care_farmer', fId);
      else localStorage.removeItem('crop360_care_farmer');
    }
    onFarmerChange(fId);

    // Auto switch to that farmer's first parcel
    const matchingFarms = farms.filter((fm) => {
      const id = typeof fm.farmerId === 'object' ? fm.farmerId?._id : fm.farmerId;
      return String(id) === String(fId);
    });
    if (matchingFarms.length > 0) {
      const newFarmId = matchingFarms[0]._id;
      onFarmChange(newFarmId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crop360_care_farm', newFarmId);
      }
    } else {
      onFarmChange('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('crop360_care_farm');
      }
    }
  };

  const handleFarmSelect = (fmId: string) => {
    if (typeof window !== 'undefined') {
      if (fmId) localStorage.setItem('crop360_care_farm', fmId);
      else localStorage.removeItem('crop360_care_farm');
    }
    onFarmChange(fmId);
  };

  // Target farm ID to fetch active sowing context for
  const targetFarmId = filterFarmId || (availableFarms.length > 0 ? availableFarms[0]._id : '');

  // Fetch active sowing / cultivation context for selected parcel
  useEffect(() => {
    if (!targetFarmId) {
      setActiveCrop(null);
      lastFetchedKeyRef.current = '';
      return;
    }

    const currentKey = `${targetFarmId}_${filterFarmerId || ''}`;
    if (lastFetchedKeyRef.current === currentKey) {
      return;
    }
    lastFetchedKeyRef.current = currentKey;

    let isMounted = true;

    const fetchSowingContext = async () => {
      try {
        setCropLoading(true);
        const params = new URLSearchParams();
        params.append('farmId', targetFarmId);
        if (filterFarmerId) params.append('farmerId', filterFarmerId);
        const res = await fetch(`/api/sowing?${params.toString()}`);
        if (!isMounted) return;

        if (res.ok) {
          const json = await res.json();
          const records = json.data || [];
          if (records.length > 0) {
            const latestSow = records[0];
            const biometrics = calculateCropBiometrics(latestSow.sowingDate);
            const currentFarm = farmsRef.current.find((f) => String(f._id) === String(targetFarmId));
            const currentFarmer = farmersRef.current.find((f) => String(f._id) === String(filterFarmerId));

            const ctx: ActiveCropContext = {
              cropName: latestSow.cropName,
              varietyName: latestSow.varietyName,
              sowingDate: latestSow.sowingDate,
              daysAfterSowing: biometrics.das,
              growthStage: biometrics.stage,
              stageName: biometrics.stageName,
              plantingMethod: latestSow.plantingMethod || 'transplanting',
              plantHeightCm: biometrics.plantHeightCm,
              canopyCoveragePercent: biometrics.canopyCoveragePercent,
              tillerCountPerPlant: biometrics.tillerCountPerPlant,
              totalAreaAcres: currentFarm?.totalAreaAcres || 1,
              parcelName: currentFarm?.parcelName || 'Field Parcel',
              farmerName: currentFarmer?.name || 'Active Farmer',
              farmerId: filterFarmerId,
              farmId: targetFarmId,
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
        console.warn('Sowing context fetch notice:', e);
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
  }, [targetFarmId, filterFarmerId]);

  return (
    <div className="space-y-4">

      {/* Starting Farmer & Parcel Filter Bar */}
      <div className="bg-white dark:bg-[#1a231d] p-3.5 rounded-2xl border border-[#245C3A]/15 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-stone-500 shrink-0">
            <Filter className="w-4 h-4 text-[#245C3A]" />
            <span>Select Farmer:</span>
          </div>

          {/* Farmer Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={filterFarmerId}
              onChange={(e) => handleFarmerSelect(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            >
              <option value="">All Registered Farmers ({farmers.length})</option>
              {farmers.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.farmerCode}) {f.district ? `• ${f.district}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Farm Parcel Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={filterFarmId}
              onChange={(e) => handleFarmSelect(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            >
              <option value="">All Farm Parcels ({availableFarms.length})</option>
              {availableFarms.map((fm) => (
                <option key={fm._id} value={fm._id}>
                  {fm.parcelName} {fm.totalAreaAcres ? `(${fm.totalAreaAcres} ac)` : ''}
                </option>
              ))}
            </select>
          </div>

          {(filterFarmerId || filterFarmId) && (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('crop360_care_farmer');
                  localStorage.removeItem('crop360_care_farm');
                }
                onResetFilter();
              }}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1 underline shrink-0 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {recordCount !== undefined && (
          <div className="text-xs text-stone-500 font-medium shrink-0">
            Showing <strong className="text-[#245C3A]">{recordCount}</strong> {recordLabel}
          </div>
        )}
      </div>

      {/* Active Crop Cultivation Context Banner */}
      {activeCrop && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-[#1a231d] dark:to-[#1a231d] p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                  {activeCrop.cropName}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                  {activeCrop.varietyName}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Synced from Sowing
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-600 dark:text-stone-300 mt-1">
                <span>
                  Parcel: <strong>{activeCrop.parcelName}</strong> ({activeCrop.totalAreaAcres} ac)
                </span>
                <span>•</span>
                <span>
                  Sown: <strong>{new Date(activeCrop.sowingDate).toLocaleDateString()}</strong>
                </span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Day {activeCrop.daysAfterSowing} (DAS)
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-[#245C3A] text-white text-[10px] font-bold">
                  {activeCrop.stageName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 px-3.5 py-2 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30 text-stone-700 dark:text-stone-300 shrink-0">
            <div>
              <div className="text-[10px] text-stone-500 uppercase font-semibold">Est. Height</div>
              <div className="font-bold text-emerald-800 dark:text-emerald-300">{activeCrop.plantHeightCm} cm</div>
            </div>
            <div className="h-6 w-px bg-stone-200 dark:bg-stone-700" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase font-semibold">Canopy Cover</div>
              <div className="font-bold text-emerald-800 dark:text-emerald-300">{activeCrop.canopyCoveragePercent}%</div>
            </div>
            <div className="h-6 w-px bg-stone-200 dark:bg-stone-700" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase font-semibold">Tillers / Hill</div>
              <div className="font-bold text-emerald-800 dark:text-emerald-300">{activeCrop.tillerCountPerPlant}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
