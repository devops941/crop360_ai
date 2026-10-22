'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Sprout,
  Activity,
  Layers,
  Plus,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Ruler,
  Eye,
  X,
  Loader2,
  ArrowRight,
  Droplet,
  FlaskConical,
  Bug,
} from 'lucide-react';
import { DataTable, Column } from '@/components/common/data-table';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import { CropCareNav, FarmerOption, FarmOption, calculateCropBiometrics } from '@/components/crop-care/crop-care-nav';

interface CropGrowthRow extends Record<string, unknown> {
  _id: string;
  cropName: string;
  varietyName: string;
  observationDate: string;
  growthStage: string;
  plantHeightCm: number;
  canopyCoveragePercent: number;
  tillerCountPerPlant: number;
  healthStatus: string;
  remarks?: string;
  farmerId?: {
    _id: string;
    name: string;
    farmerCode: string;
    district: string;
  };
  farmId?: {
    _id: string;
    parcelName: string;
    surveyNumber: string;
    totalAreaAcres: number;
    soilType: string;
  };
}

export default function CropGrowthPage() {
  const searchParams = useSearchParams();
  const queryFarmerId = searchParams.get('farmerId') || '';
  const queryFarmId = searchParams.get('farmId') || '';
  const queryCropName = searchParams.get('cropName') || '';
  const queryOpenModal = searchParams.get('openModal') === 'true';

  const [logs, setLogs] = useState<CropGrowthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [sowings, setSowings] = useState<any[]>([]);

  // Filter State
  const [filterFarmerId, setFilterFarmerId] = useState(queryFarmerId);
  const [filterFarmId, setFilterFarmId] = useState(queryFarmId);

  useEffect(() => {
    if (queryFarmerId) setFilterFarmerId(queryFarmerId);
    if (queryFarmId) setFilterFarmId(queryFarmId);
  }, [queryFarmerId, queryFarmId]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [farmerId, setFarmerId] = useState(queryFarmerId || '');
  const [farmId, setFarmId] = useState(queryFarmId || '');
  const [cropName, setCropName] = useState(queryCropName || 'Paddy (Rice / Kuruvai)');
  const [varietyName, setVarietyName] = useState('CO 51');
  const [observationDate, setObservationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [growthStage, setGrowthStage] = useState('vegetative');
  const [plantHeightCm, setPlantHeightCm] = useState(35);
  const [canopyCoveragePercent, setCanopyCoveragePercent] = useState(55);
  const [tillerCountPerPlant, setTillerCountPerPlant] = useState(12);
  const [healthStatus, setHealthStatus] = useState('normal');
  const [remarks, setRemarks] = useState('');

  const loadFarmSowingDetails = useCallback(async (selectedFarmId: string) => {
    if (!selectedFarmId) return;
    try {
      const res = await fetch(`/api/sowing?farmId=${selectedFarmId}`);
      if (res.ok) {
        const json = await res.json();
        const records = json.data || [];
        // Only allow completed sowings ('sown' or 'germination_verified')
        const completedSow = records.find(
          (r: any) => r.status === 'sown' || r.status === 'germination_verified'
        );
        if (completedSow) {
          setCropName(completedSow.cropName);
          setVarietyName(completedSow.varietyName);
          const biometrics = calculateCropBiometrics(completedSow.sowingDate);
          setGrowthStage(biometrics.stage);
          setPlantHeightCm(biometrics.plantHeightCm);
          setCanopyCoveragePercent(biometrics.canopyCoveragePercent);
          setTillerCountPerPlant(biometrics.tillerCountPerPlant);
        }
      }
    } catch (e) {
      console.warn('Failed to load farm sowing details', e);
    }
  }, []);

  // Filter parcels that have completed sowing (sown or germination_verified)
  const completedSownParcels = React.useMemo(() => {
    const activeFId = farmerId || filterFarmerId;
    return sowings.filter((s) => {
      const sFarmerId = typeof s.farmerId === 'object' ? s.farmerId?._id : s.farmerId;
      const matchFarmer = !activeFId || String(sFarmerId) === String(activeFId);
      return matchFarmer && (s.status === 'sown' || s.status === 'germination_verified');
    });
  }, [sowings, farmerId, filterFarmerId]);

  const handleOpenModal = () => {
    const activeFarmer = filterFarmerId || (farmers.length > 0 ? farmers[0]._id : '');
    setFarmerId(activeFarmer);

    // Pick from sown parcels only
    const activeSown = sowings.filter((s) => {
      const sFarmerId = typeof s.farmerId === 'object' ? s.farmerId?._id : s.farmerId;
      const isBelong = !activeFarmer || String(sFarmerId) === String(activeFarmer);
      return isBelong && (s.status === 'sown' || s.status === 'germination_verified');
    });

    const activeFarm =
      filterFarmId && activeSown.some((s) => String(typeof s.farmId === 'object' ? s.farmId?._id : s.farmId) === String(filterFarmId))
        ? filterFarmId
        : activeSown.length > 0
        ? typeof activeSown[0].farmId === 'object' ? activeSown[0].farmId?._id : activeSown[0].farmId
        : '';

    setFarmId(activeFarm);
    if (activeFarm) {
      loadFarmSowingDetails(activeFarm);
    }
    setShowModal(true);
  };

  // If coming directly from Sowing page with openModal=true, automatically open the modal
  useEffect(() => {
    if (queryOpenModal && queryFarmId && queryFarmerId) {
      setFarmerId(queryFarmerId);
      setFarmId(queryFarmId);
      loadFarmSowingDetails(queryFarmId);
      setShowModal(true);
    }
  }, [queryOpenModal, queryFarmId, queryFarmerId, loadFarmSowingDetails]);

  const fetchLogs = useCallback(async (fId = filterFarmerId, fmId = filterFarmId) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fId) params.set('farmerId', fId);
      if (fmId) params.set('farmId', fmId);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/crop-growth${q}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch {
      toast.error('Failed to load growth monitoring logs');
    } finally {
      setLoading(false);
    }
  }, [filterFarmerId, filterFarmId]);

  const loadLookups = useCallback(async () => {
    try {
      const [farmersRes, farmsRes, sowingRes] = await Promise.all([
        fetch('/api/farmers'),
        fetch('/api/farms'),
        fetch('/api/sowing'),
      ]);
      const fJson = await farmersRes.json();
      const fmJson = await farmsRes.json();
      const sJson = await sowingRes.json();
      if (fJson.success) setFarmers(fJson.data || []);
      if (fmJson.success) setFarms(fmJson.data || []);
      if (sJson.success) setSowings(sJson.data || []);
    } catch (e) {
      console.error('Failed to fetch lookups', e);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    fetchLogs(filterFarmerId, filterFarmId);
  }, [filterFarmerId, filterFarmId, fetchLogs]);

  // Sync modal selections when filter changes
  useEffect(() => {
    if (filterFarmerId) setFarmerId(filterFarmerId);
    if (filterFarmId) {
      setFarmId(filterFarmId);
      loadFarmSowingDetails(filterFarmId);
    }
  }, [filterFarmerId, filterFarmId, loadFarmSowingDetails]);

  const displayedLogs = logs.filter((l) => {
    const fId = typeof l.farmerId === 'object' ? l.farmerId?._id : l.farmerId;
    const fmId = typeof l.farmId === 'object' ? l.farmId?._id : l.farmId;
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

    const hasSowing = completedSownParcels.some((s) => {
      const sFarmId = typeof s.farmId === 'object' ? s.farmId?._id : s.farmId;
      return String(sFarmId) === String(farmId);
    });

    if (!hasSowing) {
      toast.warn('Sowing must be completed on this parcel before recording crop growth observations.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/crop-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          farmId,
          cropName,
          varietyName,
          observationDate,
          growthStage,
          plantHeightCm: Number(plantHeightCm),
          canopyCoveragePercent: Number(canopyCoveragePercent),
          tillerCountPerPlant: Number(tillerCountPerPlant),
          healthStatus,
          remarks,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Crop growth log recorded successfully');
        setShowModal(false);
        setRemarks('');
        fetchLogs();
      } else {
        toast.error(json.message || 'Failed to record growth log');
      }
    } catch {
      toast.error('Network error recording log');
    } finally {
      setSubmitting(false);
    }
  };

  const getStageBadge = (stage: string) => {
    const badges: Record<string, { label: string; bg: string }> = {
      germination: { label: 'Germination', bg: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300' },
      seedling: { label: 'Seedling', bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
      vegetative: { label: 'Vegetative', bg: 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
      tillering: { label: 'Active Tillering', bg: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
      flowering: { label: 'Panicle / Flowering', bg: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
      grain_filling: { label: 'Grain Filling', bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
      maturity: { label: 'Physiological Maturity', bg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
    };
    const b = badges[stage] || { label: stage, bg: 'bg-stone-100 text-stone-800' };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${b.bg} border border-current/20`}>
        {b.label}
      </span>
    );
  };

  const getHealthBadge = (health: string) => {
    if (health === 'excellent') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          Excellent Vigor
        </span>
      );
    }
    if (health === 'stressed' || health === 'chlorotic' || health === 'diseased') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span className="capitalize">{health}</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
        Normal Growth
      </span>
    );
  };

  const columns: Column<CropGrowthRow>[] = [
    {
      key: 'observationDate',
      header: 'Observed Date',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-semibold text-xs text-[#252B26] dark:text-stone-100 block">
            {new Date(r.observationDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="text-[10px] text-[#687168] dark:text-stone-400 font-mono">
            {r.growthStage}
          </span>
        </div>
      ),
    },
    {
      key: 'cropName',
      header: 'Crop & Variety',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-xs text-[#252B26] dark:text-stone-100 block">
            {r.cropName}
          </span>
          <span className="text-[11px] font-mono text-[#245C3A] dark:text-emerald-400">
            {r.varietyName}
          </span>
        </div>
      ),
    },
    {
      key: 'farmerName',
      header: 'Farmer & Parcel',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-semibold text-xs text-[#252B26] dark:text-stone-100 block">
            {r.farmerId?.name || 'Unassigned'}
          </span>
          <span className="text-[11px] text-[#687168] dark:text-stone-400 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-[#245C3A] dark:text-emerald-400" />
            {r.farmId?.parcelName || 'Field'} (Survey: {r.farmId?.surveyNumber || '—'})
          </span>
        </div>
      ),
    },
    {
      key: 'growthStage',
      header: 'Phenological Stage',
      sortable: true,
      render: (r) => getStageBadge(r.growthStage),
    },
    {
      key: 'biometrics',
      header: 'Height & Canopy',
      render: (r) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#252B26] dark:text-stone-100">
            <Ruler className="h-3.5 w-3.5 text-[#245C3A] dark:text-emerald-400" />
            <span className="font-bold font-mono">{r.plantHeightCm} cm</span>
            <span className="text-[10px] text-[#687168] dark:text-stone-400">
              ({r.tillerCountPerPlant} tillers)
            </span>
          </div>
          <div className="w-28 bg-[#E3E8DF] dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#245C3A] dark:bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, r.canopyCoveragePercent)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#687168] dark:text-stone-400 block font-mono">
            {r.canopyCoveragePercent}% Canopy Cover
          </span>
        </div>
      ),
    },
    {
      key: 'healthStatus',
      header: 'Health Condition',
      sortable: true,
      render: (r) => getHealthBadge(r.healthStatus),
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
              href={`/irrigation${q}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 transition"
              title="Schedule irrigation based on growth stage"
            >
              <Droplet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Water</span>
            </Link>
            <Link
              href={`/nutrients${q}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 transition"
              title="Formulate fertilizer doses for this stage"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Fertilizer</span>
            </Link>
            <Link
              href={`/pest-detection${q}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 transition"
              title="Inspect pests and disease signs"
            >
              <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Pests</span>
            </Link>
          </div>
        );
      },
    },
  ];

  const avgCanopy = displayedLogs.length
    ? Math.round(
        displayedLogs.reduce((acc, l) => acc + (Number(l.canopyCoveragePercent) || 0), 0) /
          displayedLogs.length
      )
    : 0;

  const stressedCount = displayedLogs.filter(
    (l) => l.healthStatus === 'stressed' || l.healthStatus === 'chlorotic' || l.healthStatus === 'diseased'
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8DF] dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-[#252B26] dark:text-white tracking-tight mb-1">
            Crop Growth &amp; Canopy Monitoring
          </h1>
          <p className="text-xs text-[#687168] dark:text-[#a0b5a3]">
            Record BBCH phenological milestones, plant height, canopy interception, and stress alerts across active field parcels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Log Growth Observation</span>
        </button>
      </div>

      {/* Unified In-Season Navigation & Filter Bar */}
      <CropCareNav
        currentTab="growth"
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
        onActiveCropDetected={(ctx) => {
          setCropName(ctx.cropName);
          setVarietyName(ctx.varietyName);
          setGrowthStage(ctx.growthStage);
          setPlantHeightCm(ctx.plantHeightCm);
          setCanopyCoveragePercent(ctx.canopyCoveragePercent);
          setTillerCountPerPlant(ctx.tillerCountPerPlant);
        }}
        recordCount={displayedLogs.length}
        recordLabel="observations"
      />

      {/* 4 Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Observations Logged</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-white mt-1">{displayedLogs.length}</p>
          <span className="text-[11px] text-[#245C3A] dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>Field verified records</span>
          </span>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Mean Canopy Cover</span>
          <p className="text-2xl font-bold text-[#245C3A] dark:text-emerald-400 mt-1">
            {avgCanopy}%
          </p>
          <div className="w-full bg-[#E3E8DF] dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#245C3A] dark:bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${avgCanopy}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Dominant Active Stage</span>
          <p className="text-xl font-bold text-[#252B26] dark:text-white mt-1 truncate capitalize">
            {displayedLogs[0]?.growthStage
              ? displayedLogs[0].growthStage.replace('_', ' ')
              : displayedLogs.length === 0
              ? 'No Records'
              : 'Seedling'}
          </p>
          <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] block mt-1">
            ICAR BBCH Standard
          </span>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Stress Condition Alerts</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {stressedCount}
          </p>
          <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] block mt-1">
            {stressedCount > 0 ? 'Requires nitrogen / pest audit' : 'Optimal plant vigor'}
          </span>
        </div>
      </div>

      {/* Observation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162218] rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/40 p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8DF] dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-emerald-300 flex items-center justify-center">
                  <Sprout className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#252B26] dark:text-white">
                    Record Crop Growth Observation
                  </h2>
                  <p className="text-[11px] text-[#687168] dark:text-[#a0b5a3]">
                    Log plant biometrics and canopy coverage for precision agronomy.
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
                      const matchingSown = sowings.filter((s) => {
                        const sFarmerId = typeof s.farmerId === 'object' ? s.farmerId?._id : s.farmerId;
                        const match = !newFarmerId || String(sFarmerId) === String(newFarmerId);
                        return match && (s.status === 'sown' || s.status === 'germination_verified');
                      });
                      if (matchingSown.length > 0) {
                        const firstFarmId = typeof matchingSown[0].farmId === 'object' ? matchingSown[0].farmId?._id : matchingSown[0].farmId;
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
                    Select Land Parcel (Sown & Established) *
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
                    disabled={!farmerId || completedSownParcels.length === 0}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A] disabled:opacity-50"
                  >
                    <option value="">
                      {!farmerId
                        ? '-- Select Farmer First --'
                        : completedSownParcels.length === 0
                        ? '-- No Sown Parcels Found (Complete Sowing First) --'
                        : '-- Choose Sown Land Parcel --'}
                    </option>
                    {completedSownParcels.map((s) => {
                      const fmId = typeof s.farmId === 'object' ? s.farmId?._id : s.farmId;
                      const parcelName = typeof s.farmId === 'object' ? s.farmId?.parcelName : 'Parcel';
                      const area = typeof s.farmId === 'object' ? s.farmId?.totalAreaAcres : undefined;
                      return (
                        <option key={s._id} value={fmId}>
                          {parcelName} {area ? `(${area} ac)` : ''} • {s.cropName} ({s.varietyName}) — {s.status === 'germination_verified' ? 'Germinated' : 'Sown'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {farmerId && completedSownParcels.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Sowing Not Completed For This Farmer
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Crop Growth & Canopy Monitoring requires an established field. Sowing has not been completed or verified yet for this farmer.
                    </p>
                    <Link
                      href={`/sowing?farmerId=${farmerId}`}
                      className="inline-flex items-center gap-1 font-bold text-[#245C3A] dark:text-emerald-400 hover:underline pt-0.5 text-xs"
                    >
                      Go to Sowing & Planting Management →
                    </Link>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Seed Variety *
                  </label>
                  <input
                    type="text"
                    value={varietyName}
                    onChange={(e) => setVarietyName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Observation Date *
                  </label>
                  <input
                    type="date"
                    value={observationDate}
                    onChange={(e) => setObservationDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Growth Stage (BBCH) *
                  </label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  >
                    <option value="germination">Germination (Sprouting)</option>
                    <option value="seedling">Seedling Emergence</option>
                    <option value="vegetative">Vegetative Expansion</option>
                    <option value="tillering">Active Tillering</option>
                    <option value="flowering">Panicle / Flowering</option>
                    <option value="grain_filling">Grain Filling (Milk stage)</option>
                    <option value="maturity">Physiological Maturity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Plant Height (cm) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={plantHeightCm}
                    onChange={(e) => setPlantHeightCm(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Tiller Count per Plant
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={tillerCountPerPlant}
                    onChange={(e) => setTillerCountPerPlant(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#252B26] dark:text-stone-200">
                      Canopy Coverage Percentage: <span className="font-mono text-[#245C3A] dark:text-emerald-400 font-bold">{canopyCoveragePercent}%</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={canopyCoveragePercent}
                    onChange={(e) => setCanopyCoveragePercent(Number(e.target.value))}
                    className="w-full accent-[#245C3A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Plant Health Condition *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'excellent', label: 'Excellent' },
                      { id: 'normal', label: 'Normal' },
                      { id: 'stressed', label: 'Stressed' },
                      { id: 'chlorotic', label: 'Chlorotic' },
                      { id: 'diseased', label: 'Diseased' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setHealthStatus(st.id)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                          healthStatus === st.id
                            ? 'bg-[#245C3A] text-white border-[#245C3A]'
                            : 'bg-white dark:bg-stone-800 border-[#E3E8DF] dark:border-stone-700 text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-700'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Field Notes &amp; Agronomist Observations
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Vigorous vegetative growth, uniform green canopy, no leaf tip drying detected..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]"
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
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Save Observation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Observation Table */}
      <DataTable
        data={displayedLogs}
        columns={columns}
        searchPlaceholder="Search observations by crop, variety, or farmer..."
        searchKey="cropName"
        emptyMessage="No crop growth observations logged yet. Click 'Log Growth Observation' to record your first field biometrics."
      />

      {/* Workflow Next Step Banner */}
      <div className="bg-gradient-to-r from-[#245C3A]/10 via-[#245C3A]/5 to-transparent dark:from-[#245C3A]/20 p-4 rounded-xl border border-[#245C3A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-[#245C3A] dark:text-emerald-300 uppercase tracking-wider">
            In-Season Workflow • Step 2 of 6
          </h3>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mt-0.5">
            Calibrate water depth &amp; ETc for this stage in Irrigation Management
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Proceed with the active farmer &amp; field parcel selection preserved.
          </p>
        </div>
        <Link
          href={`/irrigation?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white shadow-xs transition shrink-0"
        >
          <span>Next: Irrigation Management</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
