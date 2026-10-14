'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Sprout, TrendingUp, CheckCircle2, AlertCircle, ArrowRight, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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

  const activePlan = plans.find((p) => p._id === activePlanId) || plans[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
              Module 6
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
              Crop Suitability & Recommendation Engine
            </h1>
          </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Plans List */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Generated Recommendations ({plans.length})
            </h3>
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
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
                    <div className="text-xs text-stone-500">
                      {p.farmId?.parcelName} ({p.farmId?.soilType})
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
                  <span className="text-xs font-bold text-[#245C3A] uppercase tracking-wider">
                    {activePlan.targetSeason.toUpperCase()} {activePlan.targetYear} • Plan #{activePlan._id.slice(-6)}
                  </span>
                  <h2 className="text-xl font-bold text-[#193D2A] dark:text-[#E8F0E9] mt-0.5">
                    {activePlan.farmerId?.name} — {activePlan.farmId?.parcelName}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Survey #{activePlan.farmId?.surveyNumber} • {activePlan.farmId?.totalAreaAcres} Acres • {activePlan.farmId?.soilType} Soil
                  </p>
                </div>

                <Link
                  href={`/seed-selection?cropName=${encodeURIComponent(activePlan.recommendations[0]?.cropName || '')}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow transition"
                >
                  Proceed to Seed Advisory (Module 7)
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Crop Cards Ranked List */}
              <div className="space-y-4">
                {activePlan.recommendations.map((crop, idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`p-6 rounded-2xl border transition bg-white dark:bg-[#1a231d] ${
                        isTop
                          ? 'border-2 border-[#245C3A] shadow-md ring-1 ring-[#245C3A]/20'
                          : 'border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isTop
                                ? 'bg-[#245C3A] text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                                {crop.cropName}
                              </h3>
                              {isTop && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white">
                                  Top Recommendation
                                </span>
                              )}
                            </div>
                            {crop.botanicalName && (
                              <span className="text-xs italic text-stone-500 font-serif">
                                {crop.botanicalName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Suitability Badge */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
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

                      {/* Economics & Yield Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-b border-stone-100 dark:border-stone-800 text-xs">
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
