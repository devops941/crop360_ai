'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Trash2,
  Sparkles,
  Sprout,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { SowingGeneratorService, GeneratedSowingSpec } from '@/services/sowing-generator.service';

import {
  SowingCard,
  SowingRecordItem,
  formatPlantingMethod,
} from '@/components/sowing/sowing-card';

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

const COMMON_CROP_PRESETS = [
  'Sugarcane',
  'Paddy (Rice)',
  'Cotton',
  'Maize',
  'Groundnut',
  'Tomato',
  'Chilli',
  'Banana',
  'Turmeric',
  'Blackgram / Pulses',
];

export default function SowingPage() {
  const searchParams = useSearchParams();
  const preselectedFarmId = searchParams.get('farmId') || '';
  const preselectedFarmerId = searchParams.get('farmerId') || '';
  const preselectedCrop = searchParams.get('cropName') || '';

  const [records, setRecords] = useState<SowingRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Filter state
  const [filterFarmerId, setFilterFarmerId] = useState(preselectedFarmerId);
  const [filterFarmId, setFilterFarmId] = useState(preselectedFarmId);

  // Farmers and farms
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState(preselectedFarmerId);
  const [selectedFarmId, setSelectedFarmId] = useState(preselectedFarmId);
  const [cropName, setCropName] = useState(preselectedCrop || 'Sugarcane');
  const [sowingStatus, setSowingStatus] = useState<'planned' | 'sown'>('sown');

  // Agronomic specs
  const initialSpec: GeneratedSowingSpec = useMemo(
    () => SowingGeneratorService.getSpec(preselectedCrop || 'Sugarcane'),
    [preselectedCrop]
  );

  const [varietyName, setVarietyName] = useState(initialSpec.varietyName);
  const [plantingMethod, setPlantingMethod] = useState(initialSpec.plantingMethod);
  const [rowToRowCm, setRowToRowCm] = useState(initialSpec.spacingCm.rowToRowCm);
  const [plantToPlantCm, setPlantToPlantCm] = useState(initialSpec.spacingCm.plantToPlantCm);
  const [nurseryAgeDays, setNurseryAgeDays] = useState(initialSpec.nurseryAgeDays || 0);
  const [seedRateKg, setSeedRateKg] = useState(initialSpec.actualSeedRateUsedKg);
  const [durationDays, setDurationDays] = useState(initialSpec.durationDays);
  const [saving, setSaving] = useState(false);
  const [quickInitializing, setQuickInitializing] = useState(false);

  // Apply crop preset
  const applyCropDefaults = useCallback((crop: string) => {
    setCropName(crop);
    const spec = SowingGeneratorService.getSpec(crop);
    setVarietyName(spec.varietyName);
    setPlantingMethod(spec.plantingMethod);
    setRowToRowCm(spec.spacingCm.rowToRowCm);
    setPlantToPlantCm(spec.spacingCm.plantToPlantCm);
    setNurseryAgeDays(spec.nurseryAgeDays || 0);
    setSeedRateKg(spec.actualSeedRateUsedKg);
    setDurationDays(spec.durationDays);
  }, []);

  // Sync with searchParams
  useEffect(() => {
    if (preselectedFarmerId) {
      setFilterFarmerId(preselectedFarmerId);
      setSelectedFarmerId(preselectedFarmerId);
    }
    if (preselectedFarmId) {
      setFilterFarmId(preselectedFarmId);
      setSelectedFarmId(preselectedFarmId);
    }
    if (preselectedCrop) {
      applyCropDefaults(preselectedCrop);
    }
  }, [preselectedFarmerId, preselectedFarmId, preselectedCrop, applyCropDefaults]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, fRes, fmRes] = await Promise.all([
        fetch('/api/sowing'),
        fetch('/api/farmers'),
        fetch('/api/farms'),
      ]);
      const recJson = await recRes.json();
      const fJson = await fRes.json();
      const fmJson = await fmRes.json();

      if (recJson.success) setRecords(recJson.data || []);
      if (fJson.success) setFarmers(fJson.data || []);
      if (fmJson.success) setFarms(fmJson.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredFarms = farms.filter((fm) => {
    const fId = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
    return !selectedFarmerId || fId === selectedFarmerId;
  });

  const availableFilterFarms = farms.filter((fm) => {
    const fId = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
    return !filterFarmerId || fId === filterFarmerId;
  });

  const displayedRecords = useMemo(() => {
    return records.filter((r) => {
      const fId = typeof r.farmerId === 'object' ? r.farmerId?._id : r.farmerId;
      const farmId = typeof r.farmId === 'object' ? r.farmId?._id : r.farmId;
      if (filterFarmerId && fId !== filterFarmerId) return false;
      if (filterFarmId && farmId !== filterFarmId) return false;
      return true;
    });
  }, [records, filterFarmerId, filterFarmId]);

  // Check if current preselected parcel already has an active sowing record
  const currentParcelHasRecord = useMemo(() => {
    if (!filterFarmId) return false;
    return records.some((r) => {
      const fId = typeof r.farmId === 'object' ? r.farmId?._id : r.farmId;
      return fId === filterFarmId;
    });
  }, [records, filterFarmId]);

  const selectedFarmObj = useMemo(
    () => farms.find((fm) => fm._id === (filterFarmId || selectedFarmId)),
    [farms, filterFarmId, selectedFarmId]
  );

  const handleUpdateStatus = async (recordId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(recordId);
      const res = await fetch('/api/sowing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setRecords((prev) =>
          prev.map((r) => (r._id === recordId ? { ...r, status: newStatus as any } : r))
        );
      } else {
        alert(json.message || 'Failed to update status');
      }
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId || !selectedFarmId) {
      alert('Please choose farmer and land parcel');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/sowing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarmerId,
          farmId: selectedFarmId,
          cropName,
          varietyName,
          plantingMethod,
          rowToRowCm,
          plantToPlantCm,
          nurseryAgeDays: plantingMethod === 'transplanting' ? nurseryAgeDays : undefined,
          actualSeedRateUsedKg: seedRateKg,
          durationDays,
          status: sowingStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        loadData();
      } else {
        alert(json.message || 'Failed to record sowing');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleQuickInitialize = async () => {
    const fId = filterFarmerId || selectedFarmerId;
    const fmId = filterFarmId || selectedFarmId;
    const cName = preselectedCrop || cropName || 'Sugarcane';

    if (!fId || !fmId) {
      alert('Farmer and parcel must be selected');
      return;
    }

    try {
      setQuickInitializing(true);
      const spec = SowingGeneratorService.getSpec(cName);
      const res = await fetch('/api/sowing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: fId,
          farmId: fmId,
          cropName: cName,
          varietyName: spec.varietyName,
          plantingMethod: spec.plantingMethod,
          rowToRowCm: spec.spacingCm.rowToRowCm,
          plantToPlantCm: spec.spacingCm.plantToPlantCm,
          nurseryAgeDays: spec.nurseryAgeDays,
          actualSeedRateUsedKg: spec.actualSeedRateUsedKg,
          durationDays: spec.durationDays,
          status: 'sown',
        }),
      });

      const json = await res.json();
      if (json.success) {
        await loadData();
      } else {
        alert(json.message || 'Failed to initialize sowing schedule');
      }
    } finally {
      setQuickInitializing(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this sowing record? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/sowing?id=${recordId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setRecords((prev) => prev.filter((r) => r._id !== recordId));
      } else {
        alert(json.message || 'Failed to delete record');
      }
    } catch {
      alert('Failed to delete record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9] mb-1 flex items-center gap-2">
            <Sprout className="w-6 h-6 text-[#245C3A]" />
            Sowing & Planting Management
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Agronomic field establishment, row × plant geometry, target population density, and harvest countdown.
          </p>
        </div>

        <button
          onClick={() => {
            if (filterFarmerId) setSelectedFarmerId(filterFarmerId);
            if (filterFarmId) setSelectedFarmId(filterFarmId);
            if (preselectedCrop) applyCropDefaults(preselectedCrop);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Sowing / Planting Event</span>
        </button>
      </div>

      {/* Farmer & Parcel Filter Bar */}
      <div className="bg-white dark:bg-[#1a231d] p-3.5 rounded-2xl border border-[#245C3A]/15 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-stone-500 shrink-0">
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
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
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
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
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
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1 underline shrink-0 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="text-xs text-stone-500 font-medium shrink-0">
          Showing <span className="font-bold text-[#245C3A]">{displayedRecords.length}</span> of {records.length} sowing records
        </div>
      </div>

      {/* Transition Callout: Ready for Sowing after Land Prep */}
      {filterFarmId && !currentParcelHasRecord && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Seedbed Prepared & Ready for Planting
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Establish Sowing for {preselectedCrop || 'Selected Crop'} on {selectedFarmObj?.parcelName || 'Land Parcel'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Land preparation operations are set. Initialize ICAR/TNAU standard planting geometry ({initialSpec.spacingCm.rowToRowCm} × {initialSpec.spacingCm.plantToPlantCm} cm, {formatPlantingMethod(initialSpec.plantingMethod)}) and harvest schedule.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleQuickInitialize}
                disabled={quickInitializing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {quickInitializing ? 'Initializing...' : `Quick Sowing for ${preselectedCrop || 'Crop'}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFarmerId(filterFarmerId);
                  setSelectedFarmId(filterFarmId);
                  if (preselectedCrop) applyCropDefaults(preselectedCrop);
                  setShowModal(true);
                }}
                className="px-3.5 py-2 rounded-xl border border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 text-xs font-semibold transition cursor-pointer"
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Records List (Two Cards Grid) */}
      {loading ? (
        <div className="p-12 text-center text-xs font-medium text-stone-500">
          Loading Sowing Records...
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/20 space-y-3">
          <Calendar className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
            No Sowing Events Recorded
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            No sowing plans exist by default. Select a parcel and crop above, or click below to log a crop establishment event.
          </p>
          <button
            onClick={() => {
              if (filterFarmerId) setSelectedFarmerId(filterFarmerId);
              if (filterFarmId) setSelectedFarmId(filterFarmId);
              if (preselectedCrop) applyCropDefaults(preselectedCrop);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C3A] text-white text-xs font-semibold shadow-xs hover:bg-[#193D2A] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Sowing Event
          </button>
        </div>
      ) : displayedRecords.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-amber-300 dark:border-amber-800/40 space-y-3">
          <Filter className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
            No Records for Selected Filter
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            There are no sowing records recorded for this farmer or parcel. Try clearing the filter or create a new sowing entry.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setFilterFarmerId('');
                setFilterFarmId('');
              }}
              className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              onClick={() => {
                if (filterFarmerId) setSelectedFarmerId(filterFarmerId);
                if (filterFarmId) setSelectedFarmId(filterFarmId);
                if (preselectedCrop) applyCropDefaults(preselectedCrop);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C3A] text-white text-xs font-semibold shadow-xs hover:bg-[#193D2A] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Sowing Event
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedRecords.map((rec) => (
            <SowingCard
              key={rec._id}
              record={rec}
              updatingStatusId={updatingStatusId}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteRecord}
            />
          ))}
        </div>
      )}

      {/* Modal: Record Sowing / Planting Event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/20 p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-base font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#245C3A]" />
                Record Sowing / Planting Event
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Crop Selector Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Quick Crop Agronomy Presets (ICAR / TNAU):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CROP_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyCropDefaults(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      cropName.toLowerCase().includes(p.toLowerCase().split(' ')[0])
                        ? 'bg-[#245C3A] text-white font-bold'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Farmer *
                </label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => {
                    setSelectedFarmerId(e.target.value);
                    setSelectedFarmId('');
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
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
                  Land Parcel *
                </label>
                <select
                  value={selectedFarmId}
                  disabled={!selectedFarmerId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#245C3A] disabled:opacity-50"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    onBlur={() => {
                      if (cropName.trim()) {
                        const spec = SowingGeneratorService.getSpec(cropName);
                        setVarietyName(spec.varietyName);
                        setPlantingMethod(spec.plantingMethod);
                        setRowToRowCm(spec.spacingCm.rowToRowCm);
                        setPlantToPlantCm(spec.spacingCm.plantToPlantCm);
                        setDurationDays(spec.durationDays);
                        setSeedRateKg(spec.actualSeedRateUsedKg);
                      }
                    }}
                    placeholder="e.g., Sugarcane"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Seed Variety *
                  </label>
                  <input
                    type="text"
                    value={varietyName}
                    onChange={(e) => setVarietyName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Planting Method
                  </label>
                  <select
                    value={plantingMethod}
                    onChange={(e) => setPlantingMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
                  >
                    <option value="furrow_sett_planting">Furrow Sett Planting (Sugarcane)</option>
                    <option value="ridge_dibbling">Ridge Dibbling (Cotton / Maize)</option>
                    <option value="pit_planting">Pit Planting (Banana / Orchards)</option>
                    <option value="transplanting">Transplanting (Paddy / Vegetables)</option>
                    <option value="direct_seeding">Direct Seeding (DSR / Pulses)</option>
                    <option value="dibbling">Dibbling (Groundnut / Turmeric)</option>
                    <option value="broadcasting">Broadcasting</option>
                    <option value="drip_fertigation_line">Drip Raised Bed Planting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Sowing Status
                  </label>
                  <select
                    value={sowingStatus}
                    onChange={(e) => setSowingStatus(e.target.value as 'planned' | 'sown')}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
                  >
                    <option value="sown">🟢 Sown / Planted</option>
                    <option value="planned">🟡 Planned (Schedule)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Row Spacing (cm)
                  </label>
                  <input
                    type="number"
                    value={rowToRowCm}
                    onChange={(e) => setRowToRowCm(parseInt(e.target.value, 10) || 20)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Plant Spacing (cm)
                  </label>
                  <input
                    type="number"
                    value={plantToPlantCm}
                    onChange={(e) => setPlantToPlantCm(parseInt(e.target.value, 10) || 15)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Seed Rate Used (Kg or Setts)
                  </label>
                  <input
                    type="number"
                    value={seedRateKg}
                    onChange={(e) => setSeedRateKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 120)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Logging...' : 'Confirm Sowing Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
