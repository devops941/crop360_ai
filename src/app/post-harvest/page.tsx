'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sun,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  X,
  Droplets,
  Award,
  ArrowRight,
  TrendingDown,
  FileCheck2,
  Package,
} from 'lucide-react';

interface PostHarvestRecord {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string };
  harvestId?: { _id: string; cropName: string; varietyName: string; totalHarvestedYieldQuintals: number };
  cropName: string;
  dryingMethod: string;
  initialMoisturePercent: number;
  finalMoisturePercent: number;
  foreignMatterPercent: number;
  brokenGrainPercent: number;
  netMarketableWeightQuintals: number;
  cleaningLossPercent: number;
  qualityCertificateGenerated: boolean;
  status: 'drying' | 'conditioning' | 'certified' | 'dispatched_to_silo';
  certificateNumber?: string;
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
}

export default function PostHarvestPage() {
  const searchParams = useSearchParams();
  const harvestIdParam = searchParams?.get('harvestId') || '';
  const initialMoistureParam = searchParams?.get('moisture') || '19.5';
  const weightParam = searchParams?.get('weight') || '78.5';

  const [records, setRecords] = useState<PostHarvestRecord[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmId: '',
    cropName: 'Paddy / Rice',
    dryingMethod: 'tarpaulin_sun_drying',
    initialMoisturePercent: Number(initialMoistureParam),
    finalMoisturePercent: 12.8,
    foreignMatterPercent: 0.8,
    brokenGrainPercent: 1.1,
    netMarketableWeightQuintals: Number(weightParam) * 0.98,
    cleaningLossPercent: 2.0,
    status: 'certified',
    notes: 'Sun-dried on polythene tarpaulin for 3 days. Cleaned through air-screen cleaner.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, farmRes] = await Promise.all([
        fetch('/api/post-harvest'),
        fetch('/api/farms'),
      ]);

      if (recRes.ok) {
        const json = await recRes.json();
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
      const res = await fetch('/api/post-harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          harvestId: harvestIdParam || undefined,
          cropName: formData.cropName,
          dryingMethod: formData.dryingMethod,
          initialMoisturePercent: Number(formData.initialMoisturePercent),
          finalMoisturePercent: Number(formData.finalMoisturePercent),
          foreignMatterPercent: Number(formData.foreignMatterPercent),
          brokenGrainPercent: Number(formData.brokenGrainPercent),
          netMarketableWeightQuintals: Number(formData.netMarketableWeightQuintals),
          cleaningLossPercent: Number(formData.cleaningLossPercent),
          status: formData.status,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to record post-harvest conditioning');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/post-harvest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setRecords((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, status: newStatus as any } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalBatches = records.length;
  const certifiedCount = records.filter((r) => r.qualityCertificateGenerated).length;
  const totalMarketableWeight = records.reduce((acc, r) => acc + (r.netMarketableWeightQuintals || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Sun className="h-3.5 w-3.5" /> Moisture Conditioning & Quality Certification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Post-Harvest Processing & QC
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Condition harvested grains down to safe 12–14% equilibrium moisture content, conduct mechanical destoning/winnowing, and generate digital quality certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Log Conditioning Batch
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Conditioned Batches</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Sun className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{totalBatches}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Drying & winnowing lots</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Marketable Weight</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalMarketableWeight.toFixed(1)} Qtl
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Net dry marketable grain</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Safe Moisture Goal</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Droplets className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">12.5%</div>
          <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400">Safe against aflatoxin & pests</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Certificates Issued</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{certifiedCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Ready for mandi trade</p>
        </div>
      </div>

      {/* Conditioning Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Fetching post-harvest drying batches...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Sun className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Processing Batches Yet</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Log Conditioning Batch" to record moisture reduction curves and generate quality certificates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map((item) => {
            const isSafe = item.finalMoisturePercent <= 13.5;
            const isDispatched = item.status === 'dispatched_to_silo';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                      Cert: {item.certificateNumber || 'QC-PENDING'}
                    </span>

                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-[#193D2A] text-stone-700 dark:text-[#CFDEC9]">
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                    {item.cropName} &bull; {item.netMarketableWeightQuintals} Qtl Net
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5">
                    Parcel: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.farmId?.parcelName}</span> &bull; 
                    Method: <span className="capitalize">{item.dryingMethod.replace(/_/g, ' ')}</span>
                  </p>

                  {/* Moisture Reduction Visual Progress */}
                  <div className="mt-4 p-3 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Initial Threshing Moisture:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{item.initialMoisturePercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Final Dry Equilibrium:</span>
                      <span className={`font-bold ${isSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                        {item.finalMoisturePercent}% (Safe)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#121c14]/60 border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Foreign Matter</span>
                      <span className="font-bold text-stone-900 dark:text-white">{item.foreignMatterPercent}%</span>
                    </div>

                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#121c14]/60 border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Broken Grains</span>
                      <span className="font-bold text-stone-900 dark:text-white">{item.brokenGrainPercent}%</span>
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
                    {item.qualityCertificateGenerated && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Certified FAQ
                      </span>
                    )}
                  </div>

                  {!isDispatched ? (
                    <button
                      onClick={() => handleUpdateStatus(item._id, 'dispatched_to_silo')}
                      disabled={updatingId === item._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors cursor-pointer"
                    >
                      Dispatch to Silo (M21) <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      In Warehouse Silo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#245C3A]/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">New Post-Harvest Conditioning Batch</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Moisture reduction & digital quality certificate
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
                    Drying Method
                  </label>
                  <select
                    value={formData.dryingMethod}
                    onChange={(e) => setFormData({ ...formData, dryingMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="tarpaulin_sun_drying">Tarpaulin Sun Drying Yard</option>
                    <option value="mechanical_dryer">Mechanical Heated Air Dryer</option>
                    <option value="solar_tunnel">Solar Tunnel Polyhouse Dryer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Initial Moisture Content (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.initialMoisturePercent}
                    onChange={(e) => setFormData({ ...formData, initialMoisturePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Final Moisture Content (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="8"
                    max="18"
                    value={formData.finalMoisturePercent}
                    onChange={(e) => setFormData({ ...formData, finalMoisturePercent: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Net Marketable Weight (Qtl) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.netMarketableWeightQuintals}
                    onChange={(e) => setFormData({ ...formData, netMarketableWeightQuintals: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Foreign Matter / Impurities (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.foreignMatterPercent}
                    onChange={(e) => setFormData({ ...formData, foreignMatterPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Conditioning & Winnowing Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Air-screen cleaner settings, moisture meter reading..."
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
                  Save & Certify Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
