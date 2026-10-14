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
  CheckCircle2,
  TrendingUp,
  MapPin,
  Ruler,
  Eye,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { DataTable, Column } from '@/components/common/data-table';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

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

interface FarmerOption {
  _id: string;
  name: string;
  farmerCode: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: string | { _id: string };
  totalAreaAcres: number;
}

export default function CropGrowthPage() {
  const searchParams = useSearchParams();
  const preselectedFarmId = searchParams.get('farmId');

  const [logs, setLogs] = useState<CropGrowthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [farmerId, setFarmerId] = useState('');
  const [farmId, setFarmId] = useState(preselectedFarmId || '');
  const [cropName, setCropName] = useState('Paddy (Rice / Kuruvai)');
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

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crop-growth');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch {
      toast.error('Failed to load growth monitoring logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [farmersRes, farmsRes] = await Promise.all([
        fetch('/api/farmers'),
        fetch('/api/farms'),
      ]);
      const fJson = await farmersRes.json();
      const fmJson = await farmsRes.json();
      if (fJson.success) setFarmers(fJson.data || []);
      if (fmJson.success) setFarms(fmJson.data || []);
    } catch (e) {
      console.error('Failed to fetch lookups', e);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    loadLookups();
  }, [fetchLogs, loadLookups]);

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
  ];

  const avgCanopy = logs.length
    ? Math.round(
        logs.reduce((acc, l) => acc + (Number(l.canopyCoveragePercent) || 0), 0) /
          logs.length
      )
    : 0;

  const stressedCount = logs.filter(
    (l) => l.healthStatus === 'stressed' || l.healthStatus === 'chlorotic' || l.healthStatus === 'diseased'
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8DF] dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E7EFE6] dark:bg-emerald-950/70 text-[#245C3A] dark:text-emerald-400 border border-[#CFDEC9] dark:border-emerald-800">
              MODULE 10
            </span>
            <span className="text-xs text-[#687168] dark:text-stone-400 font-medium">
              • Phenology &amp; Biometric Vigor
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#252B26] dark:text-white tracking-tight">
            Crop Growth &amp; Canopy Monitoring
          </h1>
          <p className="text-xs text-[#687168] dark:text-[#a0b5a3] mt-0.5">
            Record BBCH phenological milestones, plant height, canopy interception, and stress alerts across active field parcels.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Log Growth Observation</span>
        </button>
      </div>

      {/* 4 Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Observations Logged</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-white mt-1">{logs.length}</p>
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
            {logs[0]?.growthStage ? logs[0].growthStage.replace('_', ' ') : 'Tillering Stage'}
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
                      setFarmerId(e.target.value);
                      setFarmId('');
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
                    onChange={(e) => setFarmId(e.target.value)}
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
        data={logs}
        columns={columns}
        searchPlaceholder="Search observations by crop, variety, or farmer..."
        searchKey="cropName"
        emptyMessage="No crop growth observations logged yet. Click 'Log Growth Observation' to record your first field biometrics."
      />
    </div>
  );
}
