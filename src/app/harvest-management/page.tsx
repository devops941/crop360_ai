'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Tractor,
  Wheat,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Package,
  Sparkles,
  Droplets,
  Award,
  Sun,
} from 'lucide-react';

interface HarvestRecord {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres?: number };
  cropName: string;
  varietyName: string;
  harvestDate: string;
  harvestMethod: 'manual_sickle' | 'combine_harvester' | 'mini_reaper';
  totalHarvestedYieldQuintals: number;
  yieldPerAcreQuintals: number;
  moistureAtHarvestPercent: number;
  grainQualityGrade: 'grade_a_faq' | 'grade_b' | 'premium_organic';
  bagCount: number;
  machineryRentalCostInr: number;
  totalHarvestCostInr: number;
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
  totalAreaAcres?: number;
}

export default function HarvestManagementPage() {
  const searchParams = useSearchParams();
  const farmIdParam = searchParams?.get('farmId') || '';
  const cropParam = searchParams?.get('crop') || '';

  const [records, setRecords] = useState<HarvestRecord[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    farmId: farmIdParam,
    cropName: cropParam || 'Paddy / Rice',
    varietyName: 'CO 51',
    harvestDate: new Date().toISOString().split('T')[0],
    harvestMethod: 'combine_harvester',
    totalHarvestedYieldQuintals: 78.5,
    yieldPerAcreQuintals: 26.2,
    moistureAtHarvestPercent: 19.4,
    grainQualityGrade: 'grade_a_faq',
    bagCount: 157,
    machineryRentalCostInr: 5200,
    totalHarvestCostInr: 7800,
    notes: 'Combine harvester operation completed under clear sunny sky. Zero shattering observed.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsRes, farmsRes] = await Promise.all([
        fetch('/api/harvest-records'),
        fetch('/api/farms'),
      ]);

      if (recordsRes.ok) {
        const json = await recordsRes.json();
        setRecords(json.data || []);
      }
      if (farmsRes.ok) {
        const json = await farmsRes.json();
        setFarms(json.data || []);
        if (json.data?.length > 0 && !formData.farmId) {
          setFormData((prev) => ({ ...prev, farmId: farmIdParam || json.data[0]._id }));
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
  }, [farmIdParam]);

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
      const res = await fetch('/api/harvest-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          cropName: formData.cropName,
          varietyName: formData.varietyName,
          harvestDate: formData.harvestDate,
          harvestMethod: formData.harvestMethod,
          totalHarvestedYieldQuintals: Number(formData.totalHarvestedYieldQuintals),
          yieldPerAcreQuintals: Number(formData.yieldPerAcreQuintals),
          moistureAtHarvestPercent: Number(formData.moistureAtHarvestPercent),
          grainQualityGrade: formData.grainQualityGrade,
          bagCount: Number(formData.bagCount),
          machineryRentalCostInr: Number(formData.machineryRentalCostInr),
          totalHarvestCostInr: Number(formData.totalHarvestCostInr),
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to record harvest operation');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording harvest');
    } finally {
      setSubmitting(false);
    }
  };

  const totalYieldSum = records.reduce((acc, r) => acc + (r.totalHarvestedYieldQuintals || 0), 0);
  const totalBagsSum = records.reduce((acc, r) => acc + (r.bagCount || 0), 0);
  const avgYieldPerAcre = records.length
    ? Math.round(
        (records.reduce((acc, r) => acc + (r.yieldPerAcreQuintals || 0), 0) / records.length) * 10
      ) / 10
    : 26.2;
  const totalCostSum = records.reduce((acc, r) => acc + (r.totalHarvestCostInr || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Tractor className="h-3.5 w-3.5" /> Threshing, Gunny Bags & Grading Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Harvest & Yield Management
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Log combine harvester and manual thresher operations, record total quintals harvested, tally gunny sacks, and certify FAQ quality grades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/post-harvest"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <Sun className="h-4 w-4" />
            Post-Harvest Drying &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Log Harvest Record
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Total Harvested</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Wheat className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            {totalYieldSum.toFixed(1)} Qtl
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Total gross grain yield</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Avg Yield / Acre</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {avgYieldPerAcre} Qtl/ac
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Above regional average</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Gunny Bags Tagged</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalBagsSum} Bags
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">50kg standard gunny sacks</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Total Harvest Cost</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₹{totalCostSum.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Machine rental & labor fees</p>
        </div>
      </div>

      {/* Harvest Records List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Fetching harvest operational ledger...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Tractor className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Harvest Records Yet</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Log Harvest Record" to record actual quintals, combine harvester hours, and bag tallies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map((item) => {
            const isFaq = item.grainQualityGrade === 'grade_a_faq';
            const isOrganic = item.grainQualityGrade === 'premium_organic';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isOrganic
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          : isFaq
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200'
                          : 'bg-stone-100 dark:bg-[#193D2A] text-stone-700 dark:text-[#CFDEC9]'
                      }`}
                    >
                      {item.grainQualityGrade.replace('_', ' ')}
                    </span>

                    <span className="text-[11px] text-stone-400">
                      {new Date(item.harvestDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                    {item.cropName} &bull; {item.varietyName}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5">
                    Parcel: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.farmId?.parcelName}</span> &bull;
                    Method: <span className="capitalize">{item.harvestMethod.replace('_', ' ')}</span>
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Total Harvested</span>
                      <span className="font-bold text-stone-900 dark:text-white text-sm">
                        {item.totalHarvestedYieldQuintals} Qtl
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Yield / Acre</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {item.yieldPerAcreQuintals} Qtl/ac
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Moisture at Threshing</span>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {item.moistureAtHarvestPercent}%
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Bags Tagged</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {item.bagCount} Sacks
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-[11px] text-stone-600 dark:text-[#a0b5a3] italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-stone-400 text-[10px] block">Total Cost</span>
                    <span className="font-bold text-stone-800 dark:text-white">₹{item.totalHarvestCostInr.toLocaleString()}</span>
                  </div>

                  <Link
                    href={`/post-harvest?harvestId=${item._id}&moisture=${item.moistureAtHarvestPercent}&weight=${item.totalHarvestedYieldQuintals}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 hover:bg-[#CFDEC9] transition-colors"
                  >
                    Send to Drying (M20) <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Harvest Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#245C3A]/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white">
                  <Tractor className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Log Field Harvest Operation</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Threshing yield, moisture level & gunny bag tallies
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
                    Harvest Date *
                  </label>
                  <input
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Harvesting Method
                  </label>
                  <select
                    value={formData.harvestMethod}
                    onChange={(e) => setFormData({ ...formData, harvestMethod: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="combine_harvester">Combine Harvester (Thresher + Cleaner)</option>
                    <option value="manual_sickle">Manual Sickle Cutting & Power Threshing</option>
                    <option value="mini_reaper">Walk-Behind Mini Reaper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Total Harvested Yield (Quintals) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.totalHarvestedYieldQuintals}
                    onChange={(e) => setFormData({ ...formData, totalHarvestedYieldQuintals: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Yield / Acre (Quintals) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.yieldPerAcreQuintals}
                    onChange={(e) => setFormData({ ...formData, yieldPerAcreQuintals: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Moisture at Harvest (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.moistureAtHarvestPercent}
                    onChange={(e) => setFormData({ ...formData, moistureAtHarvestPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Gunny Bags Count (50kg sacks)
                  </label>
                  <input
                    type="number"
                    value={formData.bagCount}
                    onChange={(e) => setFormData({ ...formData, bagCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Quality Grade
                  </label>
                  <select
                    value={formData.grainQualityGrade}
                    onChange={(e) => setFormData({ ...formData, grainQualityGrade: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="grade_a_faq">Grade A (Fair Average Quality - FAQ)</option>
                    <option value="premium_organic">Premium Certified Organic</option>
                    <option value="grade_b">Grade B (Commercial Milling)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Total Harvest Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.totalHarvestCostInr}
                    onChange={(e) => setFormData({ ...formData, totalHarvestCostInr: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Notes & Machine Operator Details
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Harvester operator contact, field moisture reading..."
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
                  Save Harvest Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
