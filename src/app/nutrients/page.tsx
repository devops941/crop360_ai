'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Layers,
  FlaskConical,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Check,
  X,
  Loader2,
  Coins,
  ArrowRight,
  Bug,
  CloudSun,
} from 'lucide-react';
import { DataTable, Column } from '@/components/common/data-table';
import { toast } from 'react-toastify';
import { CropCareNav, FarmerOption, FarmOption, ActiveCropContext } from '@/components/crop-care/crop-care-nav';

interface SplitApplication {
  stage: string;
  timingDaysAfterSowing: number;
  fertilizerType: string;
  quantityKgPerAcre: number;
  applicationMethod: string;
  status: string;
  appliedDate?: string;
}

interface NutrientPlanRow extends Record<string, unknown> {
  _id: string;
  cropName: string;
  varietyName: string;
  targetYieldQuintalsPerAcre: number;
  splitApplications: SplitApplication[];
  totalFertilizerCostEstInr: number;
  organicManureTonnesPerAcre: number;
  status: string;
  createdAt: string;
  farmerId?: {
    _id: string;
    name: string;
    farmerCode: string;
    district?: string;
  };
  farmId?: {
    _id: string;
    parcelName: string;
    surveyNumber: string;
    totalAreaAcres: number;
  };
}

export default function NutrientsPage() {
  const searchParams = useSearchParams();
  const queryFarmerId = searchParams.get('farmerId') || '';
  const queryFarmId = searchParams.get('farmId') || '';
  const queryCropName = searchParams.get('cropName') || '';

  const [plans, setPlans] = useState<NutrientPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [activeCropInfo, setActiveCropInfo] = useState<ActiveCropContext | null>(null);

  // Filter State
  const [filterFarmerId, setFilterFarmerId] = useState(queryFarmerId);
  const [filterFarmId, setFilterFarmId] = useState(queryFarmId);

  useEffect(() => {
    if (queryFarmerId) setFilterFarmerId(queryFarmerId);
    if (queryFarmId) setFilterFarmId(queryFarmId);
  }, [queryFarmerId, queryFarmId]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [farmerId, setFarmerId] = useState(queryFarmerId || '');
  const [farmId, setFarmId] = useState(queryFarmId || '');
  const [cropName, setCropName] = useState(queryCropName || 'Paddy (Rice / Samba)');
  const [varietyName, setVarietyName] = useState('CR 1009 Sub 1');
  const [targetYield, setTargetYield] = useState(28);
  const [organicManure, setOrganicManure] = useState(5);

  const loadFarmSowingDetails = useCallback(async (selectedFarmId: string) => {
    if (!selectedFarmId) return;
    try {
      const res = await fetch(`/api/sowing?farmId=${selectedFarmId}`);
      if (res.ok) {
        const json = await res.json();
        const records = json.data || [];
        if (records.length > 0) {
          const sow = records[0];
          setCropName(sow.cropName);
          setVarietyName(sow.varietyName);
        }
      }
    } catch (e) {
      console.warn('Failed to load farm sowing details', e);
    }
  }, []);

  const handleOpenModal = () => {
    const activeFarmer = filterFarmerId || (farmers.length > 0 ? farmers[0]._id : '');
    setFarmerId(activeFarmer);

    const matchingFarms = farms.filter((fm) => {
      const fOwnerId = typeof fm.farmerId === 'object' ? fm.farmerId?._id : fm.farmerId;
      return !activeFarmer || String(fOwnerId) === String(activeFarmer);
    });

    const activeFarm =
      filterFarmId && matchingFarms.some((f) => String(f._id) === String(filterFarmId))
        ? filterFarmId
        : matchingFarms.length > 0
        ? matchingFarms[0]._id
        : '';

    setFarmId(activeFarm);
    if (activeFarm) {
      loadFarmSowingDetails(activeFarm);
    }
    setShowModal(true);
  };

  // Sync modal selections when filter changes
  useEffect(() => {
    if (filterFarmerId) setFarmerId(filterFarmerId);
    if (filterFarmId) {
      setFarmId(filterFarmId);
      loadFarmSowingDetails(filterFarmId);
    }
  }, [filterFarmerId, filterFarmId, loadFarmSowingDetails]);

  const fetchPlans = useCallback(async (fFarmerId?: string, fFarmId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const targetFarmer = fFarmerId !== undefined ? fFarmerId : filterFarmerId;
      const targetFarm = fFarmId !== undefined ? fFarmId : filterFarmId;
      if (targetFarmer) params.append('farmerId', targetFarmer);
      if (targetFarm) params.append('farmId', targetFarm);
      const url = `/api/nutrients${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPlans(json.data || []);
      }
    } catch {
      toast.error('Failed to load nutrient plans');
    } finally {
      setLoading(false);
    }
  }, [filterFarmerId, filterFarmId]);

  const loadLookups = useCallback(async () => {
    try {
      const [fRes, fmRes] = await Promise.all([
        fetch('/api/farmers'),
        fetch('/api/farms'),
      ]);
      const fJson = await fRes.json();
      const fmJson = await fmRes.json();
      if (fJson.success) setFarmers(fJson.data || []);
      if (fmJson.success) setFarms(fmJson.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchPlans(filterFarmerId, filterFarmId);
  }, [filterFarmerId, filterFarmId, fetchPlans]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const displayedPlans = plans.filter((p) => {
    const fId = typeof p.farmerId === 'object' ? p.farmerId?._id : p.farmerId;
    const fmId = typeof p.farmId === 'object' ? p.farmId?._id : p.farmId;
    if (filterFarmerId && String(fId) !== String(filterFarmerId)) return false;
    if (filterFarmId && String(fmId) !== String(filterFarmId)) return false;
    return true;
  });

  const filteredFarms = farms.filter((fm) => {
    if (!farmerId) return true;
    const fOwnerId = typeof fm.farmerId === 'object' ? fm.farmerId?._id : fm.farmerId;
    return String(fOwnerId) === String(farmerId);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId || !farmId) {
      toast.warn('Please select both farmer and land parcel');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/nutrients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          farmId,
          cropName,
          varietyName,
          targetYieldQuintalsPerAcre: Number(targetYield),
          organicManureTonnesPerAcre: Number(organicManure),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Precision fertilizer split plan created');
        setShowModal(false);
        fetchPlans();
      } else {
        toast.error(json.message || 'Generation failed');
      }
    } catch {
      toast.error('Network error creating plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDose = async (planId: string, stageIndex: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'applied' ? 'scheduled' : 'applied';
    try {
      const res = await fetch('/api/nutrients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, stageIndex, status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Dose marked as ${nextStatus}`);
        fetchPlans();
      }
    } catch {
      toast.error('Failed to update dose');
    }
  };

  const getStageName = (s: string) => {
    const names: Record<string, string> = {
      basal: 'Basal Dosage (At Sowing)',
      first_top_dress: '1st Top Dressing (Active Tillering)',
      second_top_dress: '2nd Top Dressing (Panicle Initiation)',
      foliar_spray: 'Foliar Spray (Flowering / Grain filling)',
    };
    return names[s] || s;
  };

  const columns: Column<NutrientPlanRow>[] = [
    {
      key: 'cropName',
      header: 'Crop & Land Parcel',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-xs text-[#252B26] dark:text-stone-100 block">
            {r.cropName} ({r.varietyName})
          </span>
          <span className="text-[11px] text-[#687168] dark:text-stone-400 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-[#245C3A] dark:text-emerald-400" />
            {r.farmId?.parcelName} • {r.farmerId?.name}
          </span>
        </div>
      ),
    },
    {
      key: 'targetYield',
      header: 'Target Yield',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold font-mono text-xs text-[#245C3A] dark:text-emerald-400 block">
            {r.targetYieldQuintalsPerAcre} q/ac
          </span>
          <span className="text-[10px] text-[#687168] dark:text-stone-400">
            {r.organicManureTonnesPerAcre}t FYM Compost
          </span>
        </div>
      ),
    },
    {
      key: 'splits',
      header: 'Split Dosing Progress',
      render: (r) => (
        <div className="space-y-1.5 min-w-[260px]">
          {r.splitApplications.map((sp, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-[11px] p-1.5 rounded bg-[#F1F5EE] dark:bg-stone-800/80 border border-[#E3E8DF] dark:border-stone-700"
            >
              <div>
                <span className="font-semibold text-[#252B26] dark:text-stone-200 block">
                  {getStageName(sp.stage)}
                </span>
                <span className="text-[10px] text-[#687168] dark:text-stone-400 truncate max-w-[180px] block">
                  {sp.fertilizerType}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleDose(r._id, idx, sp.status)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition flex items-center gap-1 ${
                  sp.status === 'applied'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-stone-700 text-[#252B26] dark:text-stone-200 border border-[#E3E8DF] dark:border-stone-600'
                }`}
              >
                {sp.status === 'applied' ? (
                  <>
                    <Check className="h-2.5 w-2.5" /> Applied
                  </>
                ) : (
                  'Mark Done'
                )}
              </button>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'totalFertilizerCostEstInr',
      header: 'Est. Cost / Acre',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold font-mono text-xs text-[#252B26] dark:text-stone-100 block">
            ₹{r.totalFertilizerCostEstInr.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#245C3A] dark:text-emerald-400 font-medium">
            Subsidized Basal/Urea
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Care Actions',
      render: (r) => {
        const fId = typeof r.farmerId === 'object' ? r.farmerId?._id : r.farmerId;
        const fmId = typeof r.farmId === 'object' ? r.farmId?._id : r.farmId;
        const q = `?farmerId=${fId || ''}&farmId=${fmId || ''}&cropName=${encodeURIComponent(r.cropName || '')}`;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/pest-detection${q}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 transition"
              title="Scout for leaf folding, blast, or stem borers"
            >
              <Bug className="h-3 w-3" />
              <span>Pests</span>
            </Link>
            <Link
              href={`/weather${q}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 hover:bg-sky-100 transition"
              title="Check foliar spray weather window"
            >
              <CloudSun className="h-3 w-3" />
              <span>Spray Window</span>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8DF] dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-[#252B26] dark:text-white tracking-tight mb-1">
            Fertilizer &amp; Nutrient Management
          </h1>
          <p className="text-xs text-[#687168] dark:text-[#a0b5a3]">
            ICAR crop response calibrated split-dose nutrition timetables, basal composting, and foliar micronutrient schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Formulate Nutrient Plan</span>
        </button>
      </div>

      {/* Unified In-Season Navigation & Filter Bar */}
      <CropCareNav
        currentTab="nutrients"
        farmers={farmers}
        farms={farms}
        filterFarmerId={filterFarmerId}
        filterFarmId={filterFarmId}
        onFarmerChange={(id) => {
          setFilterFarmerId(id);
        }}
        onFarmChange={(id) => setFilterFarmId(id)}
        onResetFilter={() => {
          setFilterFarmerId('');
          setFilterFarmId('');
        }}
        recordCount={displayedPlans.length}
        recordLabel="nutrition plans"
        onActiveCropDetected={(ctx) => {
          setActiveCropInfo(ctx);
          if (ctx.cropName) setCropName(ctx.cropName);
          if (ctx.varietyName) setVarietyName(ctx.varietyName);
        }}
      />

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Active Nutrition Plans</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-white mt-1">{displayedPlans.length}</p>
          <span className="text-[11px] text-[#245C3A] dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>Target yield calibrated</span>
          </span>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Mean Cost / Acre</span>
          <p className="text-2xl font-bold text-[#245C3A] dark:text-emerald-400 mt-1">
            ₹
            {displayedPlans.length
              ? Math.round(
                  displayedPlans.reduce((acc, p) => acc + p.totalFertilizerCostEstInr, 0) /
                    displayedPlans.length
                ).toLocaleString('en-IN')
              : '4,250'}
          </p>
          <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] mt-1 block">
            Co-operative society rates
          </span>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Avg Target Yield</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-white mt-1">
            {displayedPlans.length
              ? Math.round(
                  displayedPlans.reduce((acc, p) => acc + p.targetYieldQuintalsPerAcre, 0) /
                    displayedPlans.length
                )
              : 25}{' '}
            <span className="text-xs font-normal text-[#687168]">q/ac</span>
          </p>
          <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] mt-1 block">
            High-yield variety norm
          </span>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Organic Enrichment</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            5.0 <span className="text-xs font-normal text-[#687168]">t/ac FYM</span>
          </p>
          <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] mt-1 block">
            Soil Carbon enhancement
          </span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162218] rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/40 p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8DF] dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-emerald-300 flex items-center justify-center">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#252B26] dark:text-white">
                    Formulate Precision Nutrient Plan
                  </h2>
                  <p className="text-[11px] text-[#687168] dark:text-[#a0b5a3]">
                    Generate 4-stage split fertilization timetable for target yield.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#687168] hover:text-[#252B26] dark:text-stone-400 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeCropInfo && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Auto-calibrated for Active Cultivation: <strong>{activeCropInfo.cropName} ({activeCropInfo.varietyName})</strong> — {activeCropInfo.stageName} (DAS {activeCropInfo.daysAfterSowing})
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Select Farmer *
                  </label>
                  <select
                    value={farmerId}
                    onChange={(e) => {
                      const newFarmerId = e.target.value;
                      setFarmerId(newFarmerId);
                      const newMatchingFarms = farms.filter((fm) => {
                        const fOwnerId = typeof fm.farmerId === 'object' ? fm.farmerId?._id : fm.farmerId;
                        return String(fOwnerId) === String(newFarmerId);
                      });
                      if (newMatchingFarms.length > 0) {
                        const firstFarmId = newMatchingFarms[0]._id;
                        setFarmId(firstFarmId);
                        loadFarmSowingDetails(firstFarmId);
                      } else {
                        setFarmId('');
                      }
                    }}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  >
                    <option value="">-- Choose Registered Farmer --</option>
                    {farmers.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.farmerCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Select Land Parcel *
                  </label>
                  <select
                    value={farmId}
                    onChange={(e) => {
                      const newFarmId = e.target.value;
                      setFarmId(newFarmId);
                      if (newFarmId) {
                        loadFarmSowingDetails(newFarmId);
                      }
                    }}
                    required
                    disabled={!farmerId}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  >
                    <option value="">
                      {!farmerId ? '-- Select Farmer First --' : '-- Choose Land Parcel --'}
                    </option>
                    {filteredFarms.map((fm) => (
                      <option key={fm._id} value={fm._id}>
                        {fm.parcelName} ({fm.totalAreaAcres} ac)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Crop Name
                  </label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Seed Variety
                  </label>
                  <input
                    type="text"
                    value={varietyName}
                    onChange={(e) => setVarietyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Target Yield (Quintals/Acre)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={targetYield}
                    onChange={(e) => setTargetYield(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Basal Compost (Tonnes/Acre)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={organicManure}
                    onChange={(e) => setOrganicManure(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3E8DF] dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-[#687168] dark:text-stone-400 hover:bg-[#F1F5EE] dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                  <span>Formulate Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        data={displayedPlans}
        columns={columns}
        searchPlaceholder="Search nutrient plans by crop, variety, or farmer..."
        searchKey="cropName"
        emptyMessage="No nutrient plans generated yet. Click 'Formulate Nutrient Plan' to calculate your first split dosage timetable."
      />

      {/* Workflow Next Step Banner */}
      <div className="bg-gradient-to-r from-[#245C3A]/10 via-[#245C3A]/5 to-transparent dark:from-[#245C3A]/20 p-4 rounded-xl border border-[#245C3A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-[#245C3A] dark:text-emerald-300 uppercase tracking-wider">
            In-Season Workflow • Step 4 of 6
          </h3>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mt-0.5">
            AI Pest &amp; Disease Early Detection
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Scan crop leaves for fungal lesions, stem borers, and chlorophyll loss to safeguard yield.
          </p>
        </div>
        <Link
          href={`/pest-detection?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white shadow-xs transition shrink-0"
        >
          <span>Next: Pest &amp; Disease Detection</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
