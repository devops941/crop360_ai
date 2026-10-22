'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Shovel, CheckCircle2, Clock, Plus, ArrowRight, ShieldAlert, Filter, Trash2, AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
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
  soilAmendmentRequired?: string;
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
  const preselectedFarmId = searchParams.get('farmId') || '';
  const preselectedFarmerId = searchParams.get('farmerId') || '';
  const preselectedCrop = searchParams.get('cropName') || '';

  const [plans, setPlans] = useState<LandPrepItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterFarmerId, setFilterFarmerId] = useState(preselectedFarmerId);
  const [filterFarmId, setFilterFarmId] = useState(preselectedFarmId);

  // Sync with searchParams
  useEffect(() => {
    if (preselectedFarmerId) setFilterFarmerId(preselectedFarmerId);
    if (preselectedFarmId) setFilterFarmId(preselectedFarmId);
    if (preselectedCrop) setSelectedCrop(preselectedCrop);
  }, [preselectedFarmerId, preselectedFarmId, preselectedCrop]);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(preselectedFarmerId);
  const [selectedFarmId, setSelectedFarmId] = useState(preselectedFarmId);
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

  // Step completion confirmation modal state
  const [confirmModalData, setConfirmModalData] = useState<{ planId: string; op: TillageOp } | null>(null);
  const [savingStep, setSavingStep] = useState(false);

  const handleConfirmCompleteStep = async () => {
    if (!confirmModalData) return;
    try {
      setSavingStep(true);
      const res = await fetch(`/api/land-prep/${confirmModalData.planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber: confirmModalData.op.stepNumber,
          isCompleted: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setConfirmModalData(null);
        loadPlans();
      } else {
        alert(json.message || 'Failed to update step status');
      }
    } catch {
      alert('Failed to update step status');
    } finally {
      setSavingStep(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this land preparation plan?')) return;
    try {
      const res = await fetch(`/api/land-prep/${planId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPlans((prev) => prev.filter((p) => p._id !== planId));
      } else {
        alert(json.message || 'Failed to delete plan');
      }
    } catch {
      alert('Failed to delete plan');
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

  const availableFilterFarms = farms.filter((fm) => {
    const fId = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
    return !filterFarmerId || fId === filterFarmerId;
  });

  const displayedPlans = plans.filter((p) => {
    const fId = typeof p.farmerId === 'object' ? p.farmerId?._id : p.farmerId;
    const farmId = typeof p.farmId === 'object' ? p.farmId?._id : p.farmId;
    if (filterFarmerId && fId !== filterFarmerId) return false;
    if (filterFarmId && farmId !== filterFarmId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9] mb-1">
            Land Preparation & Tillage Management
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Tillage depth tracking, clod crushing operations, basal FYM incorporation, and seedbed readiness index.
          </p>
        </div>

        <button
          onClick={() => {
            if (filterFarmerId) setSelectedFarmerId(filterFarmerId);
            if (filterFarmId) setSelectedFarmId(filterFarmId);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Tillage Plan
        </button>
      </div>

      {/* Selected Crop Notification */}
      {preselectedCrop && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Cultivation crop saved: <strong>{preselectedCrop}</strong>. Showing land preparation & tillage sequence for this parcel.
            </span>
          </div>
        </div>
      )}

      {/* Starting Farmer & Parcel Filter Bar */}
      <div className="bg-white dark:bg-[#1a231d] p-4 rounded-2xl border border-[#245C3A]/15 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 shrink-0">
            <Filter className="w-4 h-4 text-[#245C3A]" />
            <span>Select Farmer:</span>
          </div>

          {/* Farmer Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={filterFarmerId}
              onChange={(e) => {
                setFilterFarmerId(e.target.value);
                setFilterFarmId('');
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            >
              <option value="">All Registered Farmers ({farmers.length})</option>
              {farmers.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.farmerCode})
                </option>
              ))}
            </select>
          </div>

          {/* Farm Parcel Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={filterFarmId}
              onChange={(e) => setFilterFarmId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            >
              <option value="">All Farm Parcels ({availableFilterFarms.length})</option>
              {availableFilterFarms.map((fm) => (
                <option key={fm._id} value={fm._id}>
                  {fm.parcelName} ({fm.totalAreaAcres} ac)
                </option>
              ))}
            </select>
          </div>

          {(filterFarmerId || filterFarmId) && (
            <button
              onClick={() => {
                setFilterFarmerId('');
                setFilterFarmId('');
              }}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1 underline shrink-0"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="text-xs text-stone-500 font-medium shrink-0">
          Showing <span className="font-bold text-[#245C3A]">{displayedPlans.length}</span> of {plans.length} tillage plans
        </div>
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
      ) : displayedPlans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/20">
          <Shovel className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">
            {filterFarmerId || filterFarmId ? 'No Tillage Plans Found for Filter' : 'No Land Prep Schedules Active'}
          </h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            {filterFarmerId || filterFarmId
              ? 'Try resetting the filter to view schedules for all farmers.'
              : 'Create a tillage operations schedule to track seedbed pulverization and basal organic manure incorporation.'}
          </p>
          {filterFarmerId || filterFarmId ? (
            <button
              onClick={() => {
                setFilterFarmerId('');
                setFilterFarmId('');
              }}
              className="text-xs font-semibold text-[#245C3A] hover:underline"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] text-white text-sm font-semibold shadow"
            >
              <Plus className="w-4 h-4" />
              Schedule Land Prep
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {displayedPlans.map((plan) => (
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
                  <p className="text-xs text-stone-500 mt-0.5">
                    Survey #{plan.farmId?.surveyNumber} • {plan.farmId?.totalAreaAcres} Acres • Basal FYM: {plan.basalFYMApplicationTonnesPerAcre} tonnes/acre
                    {plan.soilAmendmentRequired && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold block sm:inline sm:ml-2">
                        • Amendment: {plan.soilAmendmentRequired}
                      </span>
                    )}
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
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan._id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                    title="Delete plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                      onClick={() => {
                        if (!op.isCompleted) {
                          setConfirmModalData({ planId: plan._id, op });
                        }
                      }}
                      className={`p-4 rounded-xl border transition flex items-start gap-3 select-none ${
                        op.isCompleted
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-700 cursor-default'
                          : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-[#245C3A] hover:shadow-xs cursor-pointer'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!op.isCompleted) {
                            setConfirmModalData({ planId: plan._id, op });
                          }
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border transition ${
                          op.isCompleted
                            ? 'bg-[#245C3A] text-white border-[#245C3A] cursor-default'
                            : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 hover:border-[#245C3A] cursor-pointer'
                        }`}
                        title={op.isCompleted ? 'Operation completed & locked' : 'Click to complete operation'}
                      >
                        {op.isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-bold text-sm ${op.isCompleted ? 'text-emerald-950 dark:text-emerald-100' : 'text-stone-900 dark:text-stone-100'}`}>
                            {op.stepNumber}. {op.operationName}
                          </span>
                          {op.isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 shrink-0">
                              <Lock className="w-3 h-3" /> Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{op.purpose}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-stone-400 pt-1">
                          <span>Target Depth: <strong>{op.targetDepthInches}&quot;</strong></span>
                          <span>•</span>
                          <span>Timing: <strong>{op.timingDaysBeforeSowing} days before sowing</strong></span>
                          <span>•</span>
                          <span className="capitalize">Implement: <strong>{op.implementType.replace('_', ' ')}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forward to Sowing */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                <Link
                  href={`/sowing?farmerId=${plan.farmerId?._id || ''}&farmId=${plan.farmId?._id || ''}&cropName=${encodeURIComponent(plan.cropName)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow transition"
                >
                  Proceed to Sowing & Planting
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step Completion Confirmation Modal */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/25 p-6 md:p-7 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-[#245C3A] flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Confirm Tillage Operation
                  </h3>
                  <p className="text-xs text-stone-500">Save operation completion to database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#245C3A] block">
                Operation #{confirmModalData.op.stepNumber}
              </span>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {confirmModalData.op.operationName}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {confirmModalData.op.purpose}
              </p>
              <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 pt-1">
                <span>Depth: <strong>{confirmModalData.op.targetDepthInches}&quot;</strong></span>
                <span>•</span>
                <span>Implement: <strong className="capitalize">{confirmModalData.op.implementType.replace('_', ' ')}</strong></span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> Has this step been performed in the field? Once confirmed and saved, this operation will be permanently recorded and <strong>cannot be unchecked</strong>.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                disabled={savingStep}
                className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompleteStep}
                disabled={savingStep}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {savingStep ? 'Saving to Database...' : 'Confirm & Save Operation'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
