'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Sprout,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  Package,
  ShieldCheck,
  Lock,
  Unlock,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { INDIAN_SEEDS_CATALOG } from '@/data/seed-catalog';

interface PlanItem {
  _id: string;
  targetSeason: string;
  targetYear: number;
  farmerId: { _id: string; name: string; farmerCode: string; district: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres: number; soilType: string };
  selectedCrop?: string;
  status: string;
  recommendations: Array<{
    cropName: string;
    botanicalName?: string;
    season: string;
    category: string;
    suitabilityScore: number;
    suitabilityGrade: string;
    expectedYieldRangeQuintalsPerAcre: string;
    estimatedGrossIncomePerAcreInr: number;
    waterRequirementLevel: string;
    limitingFactors: string[];
    agronomicAdvantages: string[];
  }>;
  createdAt: string;
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
  soilType: string;
}

function getSeedMetaForCrop(cropName: string) {
  const norm = cropName.toLowerCase();
  const matched = INDIAN_SEEDS_CATALOG.find(
    (s) => norm.includes(s.cropName.toLowerCase()) || s.cropName.toLowerCase().includes(norm)
  );

  if (!matched) {
    return {
      varietyName: 'Certified Hybrid / High Yielding',
      seedCategory: 'Certified',
      stockAvailable: '150 kg (In Stock)',
    };
  }

  let stockText = '450 kg (In Stock)';
  if (matched.category === 'commercial' && matched.cropName.toLowerCase().includes('sugarcane')) {
    stockText = '32,000 Setts (In Stock)';
  } else if (matched.seedRateKgNumber < 1) {
    stockText = '45 kg (In Stock)';
  } else {
    stockText = `${Math.round(matched.seedRateKgNumber * 25)} kg (In Stock)`;
  }

  return {
    varietyName: matched.varietyName,
    seedCategory:
      matched.seedCategory.charAt(0).toUpperCase() + matched.seedCategory.slice(1),
    stockAvailable: stockText,
  };
}

export default function CropSuitabilityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSoilReportId = searchParams.get('soilReportId');

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);

  // Generator modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<'kharif' | 'rabi' | 'zaid' | 'annual'>('kharif');
  const [generating, setGenerating] = useState(false);

  // Active view plan
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crop-recommendations');
      const json = await res.json();
      if (json.success && json.data) {
        setPlans(json.data);
        if (json.data.length > 0) setActivePlanId(json.data[0]._id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    async function loadOptions() {
      try {
        const [farmersRes, farmsRes] = await Promise.all([
          fetch('/api/farmers'),
          fetch('/api/farms'),
        ]);
        const fJson = await farmersRes.json();
        const fmJson = await farmsRes.json();
        if (fJson.success) setFarmers(fJson.data || []);
        if (fmJson.success) setFarms(fmJson.data || []);
      } catch {
        // ignore
      }
    }
    loadOptions();
  }, [loadPlans]);

  const filteredFarms = farms.filter((fm) => {
    const fId = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
    return !selectedFarmerId || fId === selectedFarmerId;
  });

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId || !selectedFarmId) {
      alert('Please choose both a farmer and farm parcel');
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch('/api/crop-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarmerId,
          farmId: selectedFarmId,
          soilReportId: preselectedSoilReportId || undefined,
          targetSeason: selectedSeason,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowGenModal(false);
        loadPlans();
      } else {
        alert(json.message || 'Generation failed');
      }
    } catch {
      alert('Failed to run crop suitability algorithm');
    } finally {
      setGenerating(false);
    }
  };

  const [unlockedPlanIds, setUnlockedPlanIds] = useState<string[]>([]);

  const activePlan = plans.find((p) => p._id === activePlanId) || plans[0];
  const currentSelectedCrop =
    activePlan?.selectedCrop || activePlan?.recommendations?.[0]?.cropName || '';

  const isLocked = Boolean(activePlan?.selectedCrop) && !unlockedPlanIds.includes(activePlan?._id || '');

  const handleSelectCrop = async (cropName: string) => {
    if (!activePlan) return;
    setPlans((prev) =>
      prev.map((p) => (p._id === activePlan._id ? { ...p, selectedCrop: cropName } : p))
    );
    // Lock selection for this plan
    setUnlockedPlanIds((prev) => prev.filter((id) => id !== activePlan._id));

    try {
      await fetch('/api/crop-recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: activePlan._id,
          selectedCrop: cropName,
        }),
      });
    } catch (err) {
      console.error('Failed to update selected crop in DB', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9] mb-1">
            Crop Suitability & Recommendation Engine
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Multi-variable agro-climatic matching ranking crops by soil chemistry, seasonal water access, and APMC gross margin returns.
          </p>
        </div>

        <button
          onClick={() => setShowGenModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow-sm transition"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          Generate Crop Plan
        </button>
      </div>

      {/* Generator Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/20 p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#245C3A]" />
                Run AI Crop Suitability Matcher
              </h2>
              <button
                onClick={() => setShowGenModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Select Farmer
                </label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => {
                    setSelectedFarmerId(e.target.value);
                    setSelectedFarmId('');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                  required
                >
                  <option value="">-- Choose Farmer --</option>
                  {farmers.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.farmerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Select Land Parcel
                </label>
                <select
                  value={selectedFarmId}
                  disabled={!selectedFarmerId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                  required
                >
                  <option value="">-- Choose Parcel --</option>
                  {filteredFarms.map((fm) => (
                    <option key={fm._id} value={fm._id}>
                      {fm.parcelName} ({fm.totalAreaAcres} ac, {fm.soilType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Target Cultivation Season
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                >
                  <option value="kharif">Kharif (Monsoon: June – October)</option>
                  <option value="rabi">Rabi (Winter: October – March)</option>
                  <option value="zaid">Zaid (Summer: March – June)</option>
                  <option value="annual">Annual / Year-Round Perennial</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow disabled:opacity-50"
                >
                  {generating ? 'Calculating Ag-Scores...' : 'Evaluate Suitable Crops'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-stone-500">Loading Crop Suitability Plans...</div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/20">
          <Sprout className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">No Crop Recommendations Generated</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            Run the AI suitability matcher on any registered farmer parcel to discover optimal crops with APMC profit benchmarks.
          </p>
          <button
            onClick={() => setShowGenModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] text-white text-sm font-semibold shadow"
          >
            <Sparkles className="w-4 h-4" />
            Generate First Crop Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Plans List */}
          <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Generated Recommendations ({plans.length})
            </h3>
            <div className="space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              {plans.map((p) => {
                const isSelected = p._id === activePlan?._id;
                return (
                  <button
                    key={p._id}
                    onClick={() => setActivePlanId(p._id)}
                    className={`w-full text-left p-4 rounded-xl border transition ${
                      isSelected
                        ? 'bg-white dark:bg-[#1a231d] border-[#245C3A] shadow ring-1 ring-[#245C3A]'
                        : 'bg-white/60 dark:bg-[#1a231d]/60 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-[#245C3A]">
                        {p.targetSeason} {p.targetYear}
                      </span>
                      <span className="text-xs text-stone-400">
                        {p.recommendations?.length || 0} Crops Ranked
                      </span>
                    </div>
                    <div className="text-sm font-bold text-stone-800 dark:text-stone-100">
                      {p.farmerId?.name}
                    </div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
                      <span>{p.farmId?.parcelName} ({p.farmId?.soilType})</span>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        {p.selectedCrop && <Lock className="w-2.5 h-2.5 text-emerald-600" />}
                        {p.selectedCrop ? p.selectedCrop.split(' ')[0] : p.recommendations?.[0]?.cropName?.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Ranked Recommendations */}
          {activePlan && (
            <div className="lg:col-span-8 space-y-6">
              {/* Active Plan Meta */}
              <div className="p-6 bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#245C3A] uppercase tracking-wider">
                      {activePlan.targetSeason.toUpperCase()} {activePlan.targetYear} • Plan #{activePlan._id.slice(-6)}
                    </span>
                    <span className="text-xs text-stone-400">•</span>
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Selected & Locked: <strong>{currentSelectedCrop}</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        <Unlock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Editing Unlocked
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-[#193D2A] dark:text-[#E8F0E9]">
                    {activePlan.farmerId?.name} — {activePlan.farmId?.parcelName}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Survey #{activePlan.farmId?.surveyNumber} • {activePlan.farmId?.totalAreaAcres} Acres • {activePlan.farmId?.soilType} Soil
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isLocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Are you sure you want to unlock crop selection for ${activePlan.farmId?.parcelName}? You will be able to change the crop.`
                          )
                        ) {
                          setUnlockedPlanIds((prev) => [...prev, activePlan._id]);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold shadow-xs transition cursor-pointer"
                      title="Unlock to edit crop selection"
                    >
                      <Unlock className="w-3.5 h-3.5 text-stone-500" />
                      <span>Unlock Edit</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUnlockedPlanIds((prev) => prev.filter((id) => id !== activePlan._id));
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lock Selection</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      await handleSelectCrop(currentSelectedCrop);
                      router.push(
                        `/land-prep?farmerId=${activePlan.farmerId?._id}&farmId=${activePlan.farmId?._id}&cropName=${encodeURIComponent(currentSelectedCrop)}`
                      );
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-bold shadow-sm transition shrink-0 cursor-pointer"
                  >
                    <span>Proceed to Land Preparation ({currentSelectedCrop.split(' ')[0]})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Crop Cards Ranked List */}
              <div className="space-y-4">
                {activePlan.recommendations.map((crop, idx) => {
                  const isTop = idx === 0;
                  const isSelectedCrop = currentSelectedCrop === crop.cropName;
                  const seedMeta = getSeedMetaForCrop(crop.cropName);
                  const isCardDisabled = isLocked && !isSelectedCrop;

                  return (
                    <div
                      key={idx}
                      role={isCardDisabled ? undefined : 'button'}
                      tabIndex={isCardDisabled ? -1 : 0}
                      onClick={() => {
                        if (isCardDisabled) return;
                        handleSelectCrop(crop.cropName);
                      }}
                      onKeyDown={(e) => {
                        if (isCardDisabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectCrop(crop.cropName);
                        }
                      }}
                      className={`p-6 rounded-2xl border transition-all select-none group ${
                        isSelectedCrop
                          ? 'border-2 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/25'
                          : isCardDisabled
                          ? 'border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/50 opacity-50 cursor-not-allowed'
                          : isTop
                          ? 'border-2 border-[#245C3A]/40 bg-white dark:bg-[#1a231d] hover:border-emerald-600 hover:shadow-md hover:bg-stone-50/40 dark:hover:bg-stone-900/40 cursor-pointer'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1a231d] hover:border-emerald-500/70 hover:shadow-md hover:bg-stone-50/40 dark:hover:bg-stone-900/40 cursor-pointer'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelectedCrop
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isTop
                                ? 'bg-[#245C3A] text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                                {crop.cropName}
                              </h3>
                              {isSelectedCrop && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                                  <Lock className="w-3 h-3" /> Confirmed For Cultivation
                                </span>
                              )}
                              {isCardDisabled && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-200/80 dark:bg-stone-800 text-stone-500 inline-flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-stone-400" /> Locked
                                </span>
                              )}
                              {isTop && !isSelectedCrop && !isCardDisabled && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                                  #1 Agronomic Rank
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {crop.botanicalName && (
                                <span className="text-xs italic text-stone-500 font-serif">
                                  {crop.botanicalName}
                                </span>
                              )}
                              <span className="text-[11px] text-stone-400">•</span>
                              <span className="text-[11px] text-[#245C3A] dark:text-[#6ee7b7] font-medium">
                                Variety: {seedMeta.varietyName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Suitability Badge & Active Indicator */}
                        <div className="flex items-center gap-3">
                          {isSelectedCrop ? (
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-100/70 dark:bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                              <CheckCircle2 className="w-4 h-4" /> Active Choice
                            </span>
                          ) : isCardDisabled ? (
                            <span className="text-xs text-stone-400 flex items-center gap-1 font-medium">
                              <Lock className="w-3.5 h-3.5 text-stone-400" /> Locked
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition font-medium">
                              Click card to select
                            </span>
                          )}

                          <div className="text-right pl-2 border-l border-stone-200 dark:border-stone-800">
                            <span className="text-2xl font-black text-[#193D2A] dark:text-[#E8F0E9]">
                              {crop.suitabilityScore}
                              <span className="text-sm font-normal text-stone-400">/100</span>
                            </span>
                            <span className="text-[10px] block font-bold uppercase tracking-wider text-[#245C3A]">
                              {crop.suitabilityGrade.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Economics, Yield & Seed Inventory Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 py-4 border-b border-stone-100 dark:border-stone-800 text-xs">
                        <div>
                          <span className="text-stone-500 block text-[11px]">Expected Yield / Acre</span>
                          <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                            {crop.expectedYieldRangeQuintalsPerAcre}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Est. APMC Gross Revenue</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            ₹{crop.estimatedGrossIncomePerAcreInr.toLocaleString('en-IN')} / acre
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Water Requirement</span>
                          <span className="font-semibold text-stone-700 dark:text-stone-300 capitalize">
                            {crop.waterRequirementLevel} Requirement
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Seed Category</span>
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            {seedMeta.seedCategory}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Stock</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            {seedMeta.stockAvailable}
                          </span>
                        </div>
                      </div>

                      {/* Advantages & Constraints */}
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-bold text-[#245C3A] flex items-center gap-1 mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Agronomic Advantages
                          </span>
                          <ul className="space-y-1 text-stone-600 dark:text-stone-300">
                            {crop.agronomicAdvantages.map((adv, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-[#245C3A] mt-1.5 flex-shrink-0" />
                                <span>{adv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {crop.limitingFactors.length > 0 && (
                          <div>
                            <span className="font-bold text-amber-600 flex items-center gap-1 mb-2">
                              <AlertCircle className="w-3.5 h-3.5" /> Considerations & Limiting Factors
                            </span>
                            <ul className="space-y-1 text-stone-600 dark:text-stone-300">
                              {crop.limitingFactors.map((lim, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                  <span>{lim}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs">
                          {isSelectedCrop ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <Lock className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                              Confirmed & locked for cultivation on this parcel.
                            </span>
                          ) : isCardDisabled ? (
                            <span className="text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              Selection locked. Cultivation confirmed for {currentSelectedCrop.split(' ')[0]}.
                            </span>
                          ) : (
                            <span className="text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition">
                              Click card to select {crop.cropName.split(' ')[0]} for this field.
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelectedCrop ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/land-prep?farmerId=${activePlan.farmerId?._id}&farmId=${activePlan.farmId?._id}&cropName=${encodeURIComponent(crop.cropName)}`
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer bg-[#245C3A] hover:bg-[#193D2A] text-white"
                            >
                              <span>Proceed to Land Preparation</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : isCardDisabled ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-80"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleSelectCrop(crop.cropName);
                                router.push(
                                  `/land-prep?farmerId=${activePlan.farmerId?._id}&farmId=${activePlan.farmId?._id}&cropName=${encodeURIComponent(crop.cropName)}`
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer bg-[#245C3A] hover:bg-[#193D2A] text-white"
                            >
                              <span>Select & Prepare Land ({crop.cropName.split(' ')[0]})</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
