'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Shovel, CheckCircle2, Clock, Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface TillageOp {
  stepNumber: number;
  operationName: string;
  implementType: string;
  targetDepthInches: number;
  timingDaysBeforeSowing: number;
  purpose: string;
  isCompleted: boolean;
  completedDate?: string;
}

interface LandPrepItem {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string; district: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres: number; soilType: string };
  cropName: string;
  season: string;
  tillageType: string;
  basalFYMApplicationTonnesPerAcre: number;
  operations: TillageOp[];
  readinessScorePercent: number;
  status: 'planning' | 'in_progress' | 'seedbed_ready';
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

export default function LandPrepPage() {
  const searchParams = useSearchParams();
  const preselectedFarmId = searchParams.get('farmId');
  const preselectedCrop = searchParams.get('cropName') || 'Paddy';

  const [plans, setPlans] = useState<LandPrepItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState(preselectedFarmId || '');
  const [selectedCrop, setSelectedCrop] = useState(preselectedCrop);
  const [selectedTillageType, setSelectedTillageType] = useState('conventional');
  const [creating, setCreating] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const [res, fRes, fmRes] = await Promise.all([
        fetch('/api/land-prep'),
        fetch('/api/farmers'),
        fetch('/api/farms'),
      ]);
      const json = await res.json();
      const fJson = await fRes.json();
      const fmJson = await fmRes.json();

      if (json.success) setPlans(json.data || []);
      if (fJson.success) setFarmers(fJson.data || []);
      if (fmJson.success) setFarms(fmJson.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const toggleStep = async (planId: string, stepNumber: number, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/land-prep/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber,
          isCompleted: !currentVal,
        }),
      });
      const json = await res.json();
      if (json.success) {
        loadPlans();
      }
    } catch {
      alert('Failed to update step status');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId || !selectedFarmId) {
      alert('Select farmer and land parcel');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/land-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarmerId,
          farmId: selectedFarmId,
          cropName: selectedCrop,
          tillageType: selectedTillageType,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        loadPlans();
      } else {
        alert(json.message || 'Failed to create plan');
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredFarms = farms.filter((fm) => {
    const fId = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
    return !selectedFarmerId || fId === selectedFarmerId;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
              Module 8
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
              Land Preparation & Tillage Management
            </h1>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Tillage depth tracking, clod crushing operations, basal FYM incorporation, and seedbed readiness index.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Tillage Plan
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/20 p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
                <Shovel className="w-5 h-5 text-[#245C3A]" />
                Schedule Land Preparation Sequence
              </h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
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
                      {fm.parcelName} ({fm.totalAreaAcres} Acres)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Cultivation System / Tillage Strategy
                </label>
                <select
                  value={selectedTillageType}
                  onChange={(e) => setSelectedTillageType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                >
                  <option value="conventional">Conventional Ridge & Furrow / Dry Tillage</option>
                  <option value="puddled_wetland">Puddled Wetland / Lowland Rice Nursery</option>
                  <option value="minimum_tillage">Minimum / Conservation Tillage</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Initialize Tillage Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Plans List */}
      {loading ? (
        <div className="p-12 text-center text-stone-500">Loading Land Preparation Schedules...</div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/20">
          <Shovel className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">No Land Prep Schedules Active</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            Create a tillage operations schedule to track seedbed pulverization and basal organic manure incorporation.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] text-white text-sm font-semibold shadow"
          >
            <Plus className="w-4 h-4" />
            Schedule Land Prep
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 p-6 md:p-8 shadow-sm space-y-6"
            >
              {/* Plan Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700">
                      {plan.tillageType.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-stone-400">• {plan.season}</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {plan.farmerId?.name} — {plan.farmId?.parcelName} ({plan.cropName})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Survey #{plan.farmId?.surveyNumber} • {plan.farmId?.totalAreaAcres} Acres • Basal FYM: {plan.basalFYMApplicationTonnesPerAcre} tonnes/acre
                  </p>
                </div>

                {/* Readiness Circular / Pill */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-stone-400 font-bold block uppercase">Seedbed Readiness</span>
                    <span className="text-2xl font-black text-[#193D2A] dark:text-[#E8F0E9]">
                      {plan.readinessScorePercent}%
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase ${
                      plan.status === 'seedbed_ready'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {plan.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Operations Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Sequential Tillage Operations Checklist
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.operations.map((op) => (
                    <div
                      key={op.stepNumber}
                      onClick={() => toggleStep(plan._id, op.stepNumber, op.isCompleted)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        op.isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-[#245C3A]'
                      }`}
                    >
                      <button
                        type="button"
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                          op.isCompleted
                            ? 'bg-[#245C3A] text-white border-[#245C3A]'
                            : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                        }`}
                      >
                        {op.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            {op.stepNumber}. {op.operationName}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">{op.purpose}</p>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400 pt-1">
                          <span>Target Depth: {op.targetDepthInches}&quot;</span>
                          <span>Timing: {op.timingDaysBeforeSowing} days before sowing</span>
                          {op.isCompleted && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forward to Sowing */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                <Link
                  href={`/sowing?farmId=${plan.farmId?._id}&cropName=${encodeURIComponent(plan.cropName)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow transition"
                >
                  Proceed to Sowing & Planting (Module 9)
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
