'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  Leaf,
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  X,
  Sparkles,
  Calendar,
  AlertTriangle,
  Beaker,
  Shield,
  Layers,
} from 'lucide-react';

interface CropProtectionRecord {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string };
  detectionId?: { _id: string; pestDiseaseName: string; severityLevel: string };
  cropName: string;
  targetPestOrDisease: string;
  controlStrategy: 'cultural' | 'biological' | 'chemical' | 'integrated';
  recommendedFormulation: string;
  cibrcRegistrationNumber?: string;
  dilutionDosagePerLiter: string;
  sprayVolumeLitersPerAcre: number;
  waitingPeriodDaysPHI: number;
  safetyPrecautions: string[];
  applicationMethod: string;
  sprayStatus: 'recommended' | 'scheduled' | 'completed' | 'skipped';
  scheduledSprayDate?: string;
  completedDate?: string;
  estimatedCostInrPerAcre: number;
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
}

const IPM_PRESETS = [
  {
    crop: 'Paddy / Rice',
    target: 'Brown Planthopper & Leaf Folders',
    strategy: 'biological',
    formulation: 'Azadirachtin 10,000 ppm (Neem Seed Kernel Extract)',
    dosage: '2.5 ml / L',
    volume: 200,
    phi: 3,
    method: 'knapsack_spray',
    cost: 450,
    precautions: [
      'Spray during early morning or calm late afternoon',
      'Direct spray stream towards base of tillers where planthoppers congregate',
      'Biodegradable with zero toxic residue for non-target predators',
    ],
  },
  {
    crop: 'Paddy / Rice',
    target: 'Rice Blast & Sheath Blight',
    strategy: 'biological',
    formulation: 'Pseudomonas fluorescens 0.5% WP (Bio-Fungicide)',
    dosage: '5.0 g / L',
    volume: 200,
    phi: 0,
    method: 'knapsack_spray',
    cost: 320,
    precautions: [
      'Compatible with organic farming standards',
      'Do not mix with chemical copper or bactericides',
      'Spray at 10-day intervals upon first disease manifestation',
    ],
  },
  {
    crop: 'Maize / Corn',
    target: 'Fall Armyworm (FAW)',
    strategy: 'chemical',
    formulation: 'Chlorantraniliprole 18.5% SC (Rynaxypyr)',
    dosage: '0.4 ml / L',
    volume: 200,
    phi: 14,
    method: 'knapsack_spray',
    cost: 850,
    precautions: [
      'Direct spray stream into whorls of young corn plants',
      'Strictly observe 14-day Pre-Harvest Interval (PHI) prior to cob harvest',
      'Wear protective face mask and nitrile gloves during formulation mixing',
    ],
  },
  {
    crop: 'Groundnut & Pulses',
    target: 'Tikka Spot & Anthracnose',
    strategy: 'chemical',
    formulation: 'Carbendazim 12% + Mancozeb 63% WP',
    dosage: '2.0 g / L',
    volume: 200,
    phi: 15,
    method: 'power_sprayer',
    cost: 580,
    precautions: [
      'Dual-action systemic and contact preventive barrier',
      'Avoid spraying within 4 hours of anticipated monsoon showers',
      'Do not allow spray drift towards water bodies or livestock sheds',
    ],
  },
];

export default function CropProtectionPage() {
  const searchParams = useSearchParams();
  const detectionIdParam = searchParams?.get('detectionId') || '';

  const [records, setRecords] = useState<CropProtectionRecord[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmId: '',
    cropName: 'Paddy / Rice',
    targetPestOrDisease: 'Brown Planthopper & Leaf Folders',
    controlStrategy: 'biological',
    recommendedFormulation: 'Azadirachtin 10,000 ppm (Neem Seed Kernel Extract)',
    cibrcRegistrationNumber: 'CIR-44819/2021',
    dilutionDosagePerLiter: '2.5 ml / L',
    sprayVolumeLitersPerAcre: 200,
    waitingPeriodDaysPHI: 3,
    applicationMethod: 'knapsack_spray',
    sprayStatus: 'recommended',
    scheduledSprayDate: new Date().toISOString().split('T')[0],
    estimatedCostInrPerAcre: 450,
    safetyPrecautions: 'Wear mask and gloves. Spray early morning. Direct towards tiller base.',
    notes: 'Prescribed in response to field inspection ETL breach.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const url = detectionIdParam
        ? `/api/crop-protection?detectionId=${detectionIdParam}`
        : '/api/crop-protection';

      const [protRes, farmRes] = await Promise.all([
        fetch(url),
        fetch('/api/farms'),
      ]);

      if (protRes.ok) {
        const json = await protRes.json();
        setRecords(json.data || []);
      }
      if (farmRes.ok) {
        const json = await farmRes.json();
        setFarms(json.data || []);
        if (json.data?.length > 0 && !formData.farmId) {
          setFormData((prev) => ({ ...prev, farmId: json.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [detectionIdParam]);

  const handleApplyPreset = (preset: (typeof IPM_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      cropName: preset.crop,
      targetPestOrDisease: preset.target,
      controlStrategy: preset.strategy,
      recommendedFormulation: preset.formulation,
      dilutionDosagePerLiter: preset.dosage,
      sprayVolumeLitersPerAcre: preset.volume,
      waitingPeriodDaysPHI: preset.phi,
      applicationMethod: preset.method,
      estimatedCostInrPerAcre: preset.cost,
      safetyPrecautions: preset.precautions.join('. '),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmId) {
      alert('Please select a farm parcel');
      return;
    }
    const selectedFarm = farms.find((f) => f._id === formData.farmId);
    if (!selectedFarm) {
      alert('Farm not found');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/crop-protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          detectionId: detectionIdParam || undefined,
          cropName: formData.cropName,
          targetPestOrDisease: formData.targetPestOrDisease,
          controlStrategy: formData.controlStrategy,
          recommendedFormulation: formData.recommendedFormulation,
          cibrcRegistrationNumber: formData.cibrcRegistrationNumber,
          dilutionDosagePerLiter: formData.dilutionDosagePerLiter,
          sprayVolumeLitersPerAcre: Number(formData.sprayVolumeLitersPerAcre),
          waitingPeriodDaysPHI: Number(formData.waitingPeriodDaysPHI),
          safetyPrecautions: formData.safetyPrecautions.split('.').map((s) => s.trim()).filter(Boolean),
          applicationMethod: formData.applicationMethod,
          sprayStatus: formData.sprayStatus,
          scheduledSprayDate: formData.scheduledSprayDate,
          estimatedCostInrPerAcre: Number(formData.estimatedCostInrPerAcre),
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save IPM prescription');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, sprayStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/crop-protection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, sprayStatus }),
      });
      if (res.ok) {
        setRecords((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, sprayStatus: sprayStatus as any } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = records.filter((r) => {
    if (statusFilter !== 'all' && r.sprayStatus !== statusFilter) return false;
    if (strategyFilter !== 'all' && r.controlStrategy !== strategyFilter) return false;
    return true;
  });

  const totalPrescriptions = records.length;
  const completedCount = records.filter((r) => r.sprayStatus === 'completed').length;
  const bioCount = records.filter((r) => r.controlStrategy === 'biological').length;
  const bioSharePercent = totalPrescriptions ? Math.round((bioCount / totalPrescriptions) * 100) : 60;
  const avgPhiDays = totalPrescriptions
    ? Math.round(records.reduce((acc, r) => acc + (r.waitingPeriodDaysPHI || 0), 0) / totalPrescriptions)
    : 7;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
              Module 14 &bull; Phase 5
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> ICAR & CIBRC Integrated Pest Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Crop Protection & IPM Advisory
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Prescribe bio-pesticides, safe chemical formulations, dilution dosages, and enforce mandatory Pre-Harvest Intervals (PHI) to prevent residue buildup.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/weather"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            Module 15: Weather Windows &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New IPM Prescription
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Active Prescriptions</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{totalPrescriptions}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Formulations on record</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Sprays Completed</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{completedCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Field applications verified</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Biological / Bio-Control</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Leaf className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{bioSharePercent}%</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Organic neem & bio-agents</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Avg PHI Window</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{avgPhiDays} Days</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Pre-harvest waiting time</p>
        </div>
      </div>

      {/* Filter and Strategy Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-600 dark:text-[#a0b5a3] mr-2">Filter Status:</span>
          {['all', 'recommended', 'scheduled', 'completed', 'skipped'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#245C3A] text-white'
                  : 'bg-stone-100 dark:bg-[#193D2A]/60 text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-200 dark:hover:bg-[#193D2A]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border border-[#E3E8DF] dark:border-[#245C3A]/40 bg-white dark:bg-[#121c14] text-stone-800 dark:text-stone-200 outline-none"
          >
            <option value="all">All Strategies</option>
            <option value="biological">Biological / Bio-pesticides</option>
            <option value="chemical">Targeted Chemical</option>
            <option value="cultural">Cultural / Agronomic</option>
            <option value="integrated">Integrated (IPM)</option>
          </select>
        </div>
      </div>

      {/* Prescription Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Fetching crop protection prescriptions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Prescriptions Found</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "New IPM Prescription" to create a biological or chemical spray schedule for your fields.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const isBio = item.controlStrategy === 'biological';
            const isCompleted = item.sprayStatus === 'completed';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isBio
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      }`}
                    >
                      {item.controlStrategy} control &bull; {item.applicationMethod.replace('_', ' ')}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : item.sprayStatus === 'scheduled'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.sprayStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    {item.recommendedFormulation}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5">
                    Target: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.targetPestOrDisease}</span> ({item.cropName})
                  </p>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Dilution Rate</span>
                      <span className="font-bold text-stone-900 dark:text-white">{item.dilutionDosagePerLiter}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Spray Volume</span>
                      <span className="font-bold text-stone-900 dark:text-white">{item.sprayVolumeLitersPerAcre} L / acre</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Waiting Period (PHI)</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{item.waitingPeriodDaysPHI} Days</span>
                    </div>
                  </div>

                  {item.safetyPrecautions?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-stone-600 dark:text-[#a0b5a3] flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" /> Mandatory Safety Precautions:
                      </span>
                      <ul className="text-[11px] text-stone-600 dark:text-[#CFDEC9] list-disc list-inside space-y-0.5">
                        {item.safetyPrecautions.slice(0, 2).map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-stone-500 dark:text-[#a0b5a3]">
                    Parcel: <span className="font-semibold text-stone-800 dark:text-white">{item.farmId?.parcelName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.sprayStatus !== 'completed' ? (
                      <button
                        onClick={() => handleUpdateStatus(item._id, 'completed')}
                        disabled={updatingId === item._id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Spray Completed
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Applied on Field
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Prescription Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#245C3A]/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">New IPM Crop Protection Prescription</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Pre-Harvest Intervals (PHI) & CIBRC compliant formulations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-[#193D2A] text-stone-400 hover:text-stone-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick IPM Presets */}
            <div className="my-4 p-3 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-[#a0b5a3] block mb-2">
                🌿 ICAR / CIBRC Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {IPM_PRESETS.map((p) => (
                  <button
                    key={p.formulation}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-white dark:bg-[#193D2A] border border-[#E3E8DF] dark:border-[#245C3A]/40 hover:border-[#245C3A] text-stone-800 dark:text-[#CFDEC9] transition-all"
                  >
                    {p.formulation.split(' (')[0]} ({p.strategy})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Farm Parcel *
                  </label>
                  <select
                    value={formData.farmId}
                    onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="">Select parcel</option>
                    {farms.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.parcelName} ({f.farmerId?.name || 'Farmer'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    value={formData.cropName}
                    onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Target Pest or Pathogen *
                  </label>
                  <input
                    type="text"
                    value={formData.targetPestOrDisease}
                    onChange={(e) => setFormData({ ...formData, targetPestOrDisease: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Control Strategy
                  </label>
                  <select
                    value={formData.controlStrategy}
                    onChange={(e) => setFormData({ ...formData, controlStrategy: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="biological">Biological / Bio-Pesticide</option>
                    <option value="chemical">Targeted Chemical</option>
                    <option value="cultural">Cultural / Agronomic</option>
                    <option value="integrated">Integrated (IPM)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Recommended Formulation *
                  </label>
                  <input
                    type="text"
                    value={formData.recommendedFormulation}
                    onChange={(e) => setFormData({ ...formData, recommendedFormulation: e.target.value })}
                    required
                    placeholder="e.g. Chlorantraniliprole 18.5% SC or Pseudomonas fluorescens 0.5% WP"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Dilution Dosage Per Liter *
                  </label>
                  <input
                    type="text"
                    value={formData.dilutionDosagePerLiter}
                    onChange={(e) => setFormData({ ...formData, dilutionDosagePerLiter: e.target.value })}
                    required
                    placeholder="e.g. 2.5 ml / L or 2 g / L"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Pre-Harvest Interval (PHI Days) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.waitingPeriodDaysPHI}
                    onChange={(e) => setFormData({ ...formData, waitingPeriodDaysPHI: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Spray Method
                  </label>
                  <select
                    value={formData.applicationMethod}
                    onChange={(e) => setFormData({ ...formData, applicationMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="knapsack_spray">Manual Knapsack Sprayer</option>
                    <option value="power_sprayer">Motorized Power Sprayer</option>
                    <option value="drone_spray">Agricultural Drone Atomizer</option>
                    <option value="soil_drenching">Root Zone Drenching</option>
                    <option value="seed_treatment">Seed Inoculation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Estimated Cost (₹ / Acre)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedCostInrPerAcre}
                    onChange={(e) => setFormData({ ...formData, estimatedCostInrPerAcre: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Safety Precautions & PPE
                </label>
                <textarea
                  rows={2}
                  value={formData.safetyPrecautions}
                  onChange={(e) => setFormData({ ...formData, safetyPrecautions: e.target.value })}
                  placeholder="Protective gloves, mask, wind direction warnings..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-[#245C3A]/30">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#193D2A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] rounded-xl shadow-xs transition-colors"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
