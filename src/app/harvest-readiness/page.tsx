'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Timer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Loader2,
  X,
  Gauge,
  Calendar,
  Wheat,
  Sparkles,
  Droplets,
  TrendingUp,
  Tractor,
} from 'lucide-react';

interface HarvestPrediction {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres?: number };
  cropName: string;
  varietyName: string;
  accumulatedGDD: number;
  grainMoisturePercent: number;
  visualMaturityIndexPercent: number;
  optimalHarvestStartDate: string;
  optimalHarvestEndDate: string;
  predictedYieldQuintalsPerAcre: number;
  shatteringRiskRating: 'low' | 'medium' | 'severe';
  readinessStatus: 'approaching' | 'optimal_window' | 'overdue';
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
  totalAreaAcres?: number;
}

export default function HarvestReadinessPage() {
  const [predictions, setPredictions] = useState<HarvestPrediction[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    farmId: '',
    cropName: 'Paddy / Rice',
    varietyName: 'CO 51',
    accumulatedGDD: 1980,
    grainMoisturePercent: 19.2,
    visualMaturityIndexPercent: 88,
    optimalHarvestStartDate: new Date().toISOString().split('T')[0],
    optimalHarvestEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    predictedYieldQuintalsPerAcre: 26.5,
    shatteringRiskRating: 'low',
    readinessStatus: 'optimal_window',
    notes: '85% panicles turned golden yellow. Recommended to drain field completely.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [predRes, farmRes] = await Promise.all([
        fetch('/api/harvest-prediction'),
        fetch('/api/farms'),
      ]);

      if (predRes.ok) {
        const json = await predRes.json();
        setPredictions(json.data || []);
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
  }, []);

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
      const res = await fetch('/api/harvest-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          cropName: formData.cropName,
          varietyName: formData.varietyName,
          accumulatedGDD: Number(formData.accumulatedGDD),
          grainMoisturePercent: Number(formData.grainMoisturePercent),
          visualMaturityIndexPercent: Number(formData.visualMaturityIndexPercent),
          optimalHarvestStartDate: formData.optimalHarvestStartDate,
          optimalHarvestEndDate: formData.optimalHarvestEndDate,
          predictedYieldQuintalsPerAcre: Number(formData.predictedYieldQuintalsPerAcre),
          shatteringRiskRating: formData.shatteringRiskRating,
          readinessStatus: formData.readinessStatus,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to record harvest prediction');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording prediction');
    } finally {
      setSubmitting(false);
    }
  };

  const optimalCount = predictions.filter((p) => p.readinessStatus === 'optimal_window').length;
  const avgYield = predictions.length
    ? Math.round(
        (predictions.reduce((acc, p) => acc + (p.predictedYieldQuintalsPerAcre || 0), 0) /
          predictions.length) *
          10
      ) / 10
    : 26.5;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
              Module 18 &bull; Phase 7
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" /> GDD & Moisture Maturity Predictor
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Harvest Readiness & Window Predictor
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Forecast the optimal 3-day harvest window using accumulated heat units (GDD), grain moisture levels, and shattering risk indices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/harvest-management"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <Tractor className="h-4 w-4" />
            Module 19: Record Harvest &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Assess Field Readiness
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Ready for Harvest</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Wheat className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{optimalCount} Fields</div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">Within optimal 3-day window</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Avg Predicted Yield</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{avgYield} Qtl/ac</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Calibrated against GDD curve</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Ideal Grain Moisture</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Droplets className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">18–20%</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Prevents grain shattering & mold</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Thermal Unit Goal</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#245C3A] dark:text-emerald-400">1,950 GDD</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Full physiological maturity</p>
        </div>
      </div>

      {/* Predictions Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Calculating grain moisture & GDD accumulation...</p>
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Wheat className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Harvest Assessments</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Assess Field Readiness" to log grain moisture and calculate the optimal harvest window.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {predictions.map((item) => {
            const isOptimal = item.readinessStatus === 'optimal_window';
            const isApproaching = item.readinessStatus === 'approaching';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isOptimal
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          : isApproaching
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200'
                      }`}
                    >
                      {item.readinessStatus.replace('_', ' ')}
                    </span>

                    <span className="text-[11px] font-semibold text-stone-500 dark:text-[#a0b5a3]">
                      GDD: {item.accumulatedGDD} °C-d
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                    {item.cropName} &bull; {item.varietyName}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5">
                    Parcel: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.farmId?.parcelName}</span> ({item.farmerId?.name})
                  </p>

                  {/* Optimal 3-day Window Banner */}
                  <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 dark:bg-[#121c14] border border-emerald-200 dark:border-[#245C3A]/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#245C3A] dark:text-emerald-400 block mb-1">
                      Optimal 3-Day Harvest Window:
                    </span>
                    <p className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      {new Date(item.optimalHarvestStartDate).toLocaleDateString()} &rarr; {new Date(item.optimalHarvestEndDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14]/60 border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Grain Moisture</span>
                      <span className="font-bold text-stone-900 dark:text-white">{item.grainMoisturePercent}%</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14]/60 border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Husk Yellowing</span>
                      <span className="font-bold text-stone-900 dark:text-white">{item.visualMaturityIndexPercent}%</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14]/60 border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Predicted Yield</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.predictedYieldQuintalsPerAcre} Qtl/ac</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14]/60 border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Shattering Risk</span>
                      <span className="font-bold capitalize text-stone-900 dark:text-white">{item.shatteringRiskRating}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-[11px] text-stone-600 dark:text-[#a0b5a3] italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30">
                  <Link
                    href={`/harvest-management?farmId=${item.farmId?._id}&crop=${encodeURIComponent(item.cropName)}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors"
                  >
                    Record Combine Harvest <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#245C3A]/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white">
                  <Wheat className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Assess Field Harvest Readiness</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    GDD accumulation & moisture calibration
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

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                    Grain Moisture Content (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="35"
                    value={formData.grainMoisturePercent}
                    onChange={(e) => setFormData({ ...formData, grainMoisturePercent: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Visual Maturity Index (% Yellow) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.visualMaturityIndexPercent}
                    onChange={(e) => setFormData({ ...formData, visualMaturityIndexPercent: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Accumulated GDD (°C-days)
                  </label>
                  <input
                    type="number"
                    value={formData.accumulatedGDD}
                    onChange={(e) => setFormData({ ...formData, accumulatedGDD: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Predicted Yield (Quintals / Acre)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.predictedYieldQuintalsPerAcre}
                    onChange={(e) => setFormData({ ...formData, predictedYieldQuintalsPerAcre: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Optimal Window Start *
                  </label>
                  <input
                    type="date"
                    value={formData.optimalHarvestStartDate}
                    onChange={(e) => setFormData({ ...formData, optimalHarvestStartDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Optimal Window End *
                  </label>
                  <input
                    type="date"
                    value={formData.optimalHarvestEndDate}
                    onChange={(e) => setFormData({ ...formData, optimalHarvestEndDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Shattering Risk Rating
                </label>
                <select
                  value={formData.shatteringRiskRating}
                  onChange={(e) => setFormData({ ...formData, shatteringRiskRating: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                >
                  <option value="low">Low (Tightly bound glumes)</option>
                  <option value="medium">Medium (Moderate panicle drying)</option>
                  <option value="severe">Severe (Over-dry, prompt harvest mandatory)</option>
                </select>
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
                  Save Prediction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
