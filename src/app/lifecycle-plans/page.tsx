'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Loader2,
  X,
  Target,
  Tractor,
  TrendingUp,
  MapPin,
  ListTodo,
} from 'lucide-react';

interface LifecyclePhase {
  phaseName: string;
  startDay: number;
  endDay: number;
  criticalMilestones: string[];
  estimatedBudgetSharePercent: number;
}

interface LifecyclePlan {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres?: number };
  cropName: string;
  varietyName: string;
  sowingDate: string;
  targetHarvestDate: string;
  totalDurationDays: number;
  phases: LifecyclePhase[];
  riskFactors: string[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
  totalAreaAcres?: number;
}

const CROP_PRESETS = [
  { crop: 'Paddy / Rice', variety: 'CO 51 (Short Duration)', duration: 110 },
  { crop: 'Paddy / Rice', variety: 'BPT 5204 (Samba Mahsuri)', duration: 145 },
  { crop: 'Maize / Corn', variety: 'NK 6240 Hybrid', duration: 105 },
  { crop: 'Groundnut / Peanut', variety: 'TMV 7 Semi-Spreading', duration: 115 },
  { crop: 'Cotton', variety: 'RCH 659 Bt Cotton', duration: 160 },
];

export default function LifecyclePlanPage() {
  const [plans, setPlans] = useState<LifecyclePlan[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmId: '',
    cropName: 'Paddy / Rice',
    varietyName: 'CO 51 (Short Duration)',
    sowingDate: new Date().toISOString().split('T')[0],
    totalDurationDays: 110,
    status: 'active',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, farmsRes] = await Promise.all([
        fetch('/api/lifecycle-plans'),
        fetch('/api/farms'),
      ]);

      if (plansRes.ok) {
        const json = await plansRes.json();
        setPlans(json.data || []);
        if (json.data?.length > 0 && !selectedPlanId) {
          setSelectedPlanId(json.data[0]._id);
        }
      }
      if (farmsRes.ok) {
        const json = await farmsRes.json();
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
  }, []);

  const handlePresetSelect = (preset: (typeof CROP_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      cropName: preset.crop,
      varietyName: preset.variety,
      totalDurationDays: preset.duration,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmId) {
      alert('Please select a farm parcel');
      return;
    }
    const selectedFarm = farms.find((f) => f._id === formData.farmId);
    if (!selectedFarm) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/lifecycle-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          cropName: formData.cropName,
          varietyName: formData.varietyName,
          sowingDate: formData.sowingDate,
          totalDurationDays: Number(formData.totalDurationDays),
          status: formData.status,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create lifecycle plan');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating lifecycle plan');
    } finally {
      setSubmitting(false);
    }
  };

  const activePlan = plans.find((p) => p._id === selectedPlanId) || plans[0];

  const calculateDaysSinceSowing = (sowingDateStr: string) => {
    const sDate = new Date(sowingDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - sDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const activeCount = plans.filter((p) => p.status === 'active').length;
  const totalDurationAvg = plans.length
    ? Math.round(plans.reduce((acc, p) => acc + (p.totalDurationDays || 0), 0) / plans.length)
    : 120;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
              Module 16 &bull; Phase 6
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" /> AI Autonomous Lifecycle Orchestrator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Crop Lifecycle & Phenology Planner
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Synthesize soil data, planting calendar, irrigation scheduling, and fertility splits into an automated master agronomic roadmap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/crop-tasks"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <ListTodo className="h-4 w-4" />
            Module 17: Task Engine &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Generate Lifecycle Plan
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Active Crop Plans</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{activeCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Orchestrated field parcels</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Avg Total Duration</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{totalDurationAvg} Days</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Seed to combine harvest</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Lifecycle Stages</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">5 Milestones</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">BBCH aligned phenology</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Readiness Linkage</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">Connected</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">To Module 18 Harvest Pred.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Synthesizing agronomic crop plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Target className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Lifecycle Plans Yet</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Generate Lifecycle Plan" to configure an end-to-end master calendar for your crop.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Plan Selector Bar */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
            <span className="text-xs font-semibold text-stone-500 dark:text-[#a0b5a3] px-3">Active Roadmaps:</span>
            {plans.map((p) => (
              <button
                key={p._id}
                onClick={() => setSelectedPlanId(p._id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedPlanId === p._id
                    ? 'bg-[#245C3A] text-white shadow-xs'
                    : 'text-stone-700 dark:text-[#CFDEC9] hover:bg-stone-100 dark:hover:bg-[#193D2A]'
                }`}
              >
                {p.cropName} &bull; {p.farmId?.parcelName || 'Parcel'}
              </button>
            ))}
          </div>

          {activePlan && (
            <div className="space-y-6">
              {/* Plan Header Card */}
              <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/40 bg-white dark:bg-[#162218] p-6 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-[#245C3A]/30">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
                        {activePlan.status.toUpperCase()} PLAN
                      </span>
                      <span className="text-xs text-stone-400">
                        Sown on {new Date(activePlan.sowingDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
                      {activePlan.cropName} &bull; {activePlan.varietyName}
                    </h2>
                    <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-1">
                      Parcel: <span className="font-semibold text-stone-800 dark:text-stone-200">{activePlan.farmId?.parcelName}</span> &bull; 
                      Survey No: <span className="font-semibold text-stone-800 dark:text-stone-200">{activePlan.farmId?.surveyNumber}</span> &bull;
                      Grower: <span className="font-semibold text-stone-800 dark:text-stone-200">{activePlan.farmerId?.name}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-stone-50 dark:bg-[#121c14] p-3 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/20">
                    <div>
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Target Harvest Date</span>
                      <span className="text-sm font-bold text-stone-900 dark:text-white">
                        {new Date(activePlan.targetHarvestDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-stone-200 dark:bg-[#245C3A]/40" />
                    <div>
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Day Progress</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        Day {calculateDaysSinceSowing(activePlan.sowingDate)} / {activePlan.totalDurationDays}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phenology Phase Roadmap */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
                    Milestone Progression & Budget Allocation
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {activePlan.phases?.map((phase, idx) => {
                      const curDay = calculateDaysSinceSowing(activePlan.sowingDate);
                      const isCurrent = curDay >= phase.startDay && curDay <= phase.endDay;
                      const isPast = curDay > phase.endDay;

                      return (
                        <div
                          key={phase.phaseName}
                          className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${
                            isCurrent
                              ? 'border-[#245C3A] dark:border-emerald-400 bg-[#E7EFE6]/50 dark:bg-[#193D2A]/40 ring-1 ring-[#245C3A]'
                              : isPast
                              ? 'border-[#E3E8DF] dark:border-[#245C3A]/30 bg-stone-50/50 dark:bg-[#121c14]/40 opacity-75'
                              : 'border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-2">
                              <span className="font-mono font-bold text-[#245C3A] dark:text-emerald-400">
                                Phase {idx + 1}
                              </span>
                              <span className="text-stone-400">
                                Days {phase.startDay}–{phase.endDay}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-stone-900 dark:text-white leading-tight">
                              {phase.phaseName}
                            </h4>

                            <ul className="mt-3 space-y-1.5 text-[11px] text-stone-600 dark:text-[#CFDEC9]">
                              {phase.criticalMilestones?.map((m, mIdx) => (
                                <li key={mIdx} className="flex items-start gap-1.5">
                                  <span className="text-[#245C3A] dark:text-emerald-400 shrink-0 mt-0.5">&bull;</span>
                                  <span>{m}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-200/50 dark:border-[#245C3A]/20 flex items-center justify-between text-[10px]">
                            <span className="text-stone-500 dark:text-[#a0b5a3]">Est. Budget</span>
                            <span className="font-bold text-stone-900 dark:text-white">
                              {phase.estimatedBudgetSharePercent}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Risk Factors & Recommendations */}
                {activePlan.riskFactors?.length > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      Anticipated Climatic & Biological Risk Factors:
                    </span>
                    <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                      {activePlan.riskFactors.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-[#245C3A]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Synchronized with modules 11 (Irrigation), 12 (Fertilizer), and 15 (IMD Weather).
                  </span>
                  <Link
                    href={`/crop-tasks?planId=${activePlan._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] transition-colors"
                  >
                    Generate Labor Tasks from Milestones <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generator Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#245C3A]/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Generate AI Crop Lifecycle Roadmap</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Multi-phase milestone & phenology generator
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

            {/* Presets */}
            <div className="my-4 p-3 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-[#a0b5a3] block mb-2">
                🌾 Quick Cultivar Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CROP_PRESETS.map((p) => (
                  <button
                    key={p.variety}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-white dark:bg-[#193D2A] border border-[#E3E8DF] dark:border-[#245C3A]/40 hover:border-[#245C3A] text-stone-800 dark:text-[#CFDEC9] transition-all"
                  >
                    {p.variety} ({p.duration}d)
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Target Farm Parcel *
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Crop Type *
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
                    Variety Name *
                  </label>
                  <input
                    type="text"
                    value={formData.varietyName}
                    onChange={(e) => setFormData({ ...formData, varietyName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Sowing / Emergence Date *
                  </label>
                  <input
                    type="date"
                    value={formData.sowingDate}
                    onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Total Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="45"
                    max="365"
                    value={formData.totalDurationDays}
                    onChange={(e) => setFormData({ ...formData, totalDurationDays: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
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
                  Generate Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
