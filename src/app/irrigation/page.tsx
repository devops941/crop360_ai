'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Droplet,
  Clock,
  Gauge,
  Plus,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CloudRain,
  RotateCcw,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { DataTable, Column } from '@/components/common/data-table';
import { toast } from 'react-toastify';

interface IrrigationRow extends Record<string, unknown> {
  _id: string;
  cropName: string;
  soilMoisturePercent: number;
  cropCoefficientKc: number;
  referenceEtMm: number;
  calculatedWaterRequirementLitersPerAcre: number;
  irrigationMethod: string;
  pumpDischargeRateLph: number;
  scheduledRunTimeMinutes: number;
  scheduledDate: string;
  status: string;
  notes?: string;
  farmerId?: {
    _id: string;
    name: string;
    farmerCode: string;
  };
  farmId?: {
    _id: string;
    parcelName: string;
    surveyNumber: string;
    totalAreaAcres: number;
    irrigationSource: string;
  };
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
  irrigationSource: string;
}

export default function IrrigationPage() {
  const [schedules, setSchedules] = useState<IrrigationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [farmerId, setFarmerId] = useState('');
  const [farmId, setFarmId] = useState('');
  const [cropName, setCropName] = useState('Paddy (Rice)');
  const [soilMoisturePercent, setSoilMoisturePercent] = useState(42);
  const [cropCoefficientKc, setCropCoefficientKc] = useState(0.85);
  const [referenceEtMm, setReferenceEtMm] = useState(4.5);
  const [irrigationMethod, setIrrigationMethod] = useState('drip');
  const [pumpDischargeRateLph, setPumpDischargeRateLph] = useState(12000);
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/irrigation');
      if (res.ok) {
        const json = await res.json();
        setSchedules(json.data || []);
      }
    } catch {
      toast.error('Failed to load irrigation schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [fRes, fmRes] = await Promise.all([
        fetch('/api/farmers'),
        fetch('/api/farms'),
      ]);
      const fJson = await fRes.json();
      const fmJson = await fmRes.json();
      if (fJson.success) setFarmers(fJson.data || []);
      if (fmJson.success) setFarms(fmJson.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    loadLookups();
  }, [fetchSchedules, loadLookups]);

  const filteredFarms = farms.filter((fm) => {
    if (!farmerId) return true;
    const fOwnerId = typeof fm.farmerId === 'object' ? fm.farmerId?._id : fm.farmerId;
    return String(fOwnerId) === String(farmerId);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId || !farmId) {
      toast.warn('Please select both farmer and land parcel');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/irrigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          farmId,
          cropName,
          soilMoisturePercent: Number(soilMoisturePercent),
          cropCoefficientKc: Number(cropCoefficientKc),
          referenceEtMm: Number(referenceEtMm),
          irrigationMethod,
          pumpDischargeRateLph: Number(pumpDischargeRateLph),
          scheduledDate,
          notes,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Irrigation schedule calculated and generated');
        setShowModal(false);
        fetchSchedules();
      } else {
        toast.error(json.message || 'Calculation failed');
      }
    } catch {
      toast.error('Network error generating schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/irrigation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast.success(`Schedule marked as ${status.replace('_', ' ')}`);
        fetchSchedules();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const columns: Column<IrrigationRow>[] = [
    {
      key: 'scheduledDate',
      header: 'Scheduled Date',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-semibold text-xs text-[#252B26] dark:text-stone-100 block">
            {new Date(r.scheduledDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="text-[10px] text-[#245C3A] dark:text-emerald-400 capitalize font-medium">
            {r.irrigationMethod} system
          </span>
        </div>
      ),
    },
    {
      key: 'cropName',
      header: 'Crop & Land Parcel',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-xs text-[#252B26] dark:text-stone-100 block">
            {r.cropName}
          </span>
          <span className="text-[11px] text-[#687168] dark:text-stone-400 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-[#245C3A] dark:text-emerald-400" />
            {r.farmId?.parcelName} ({r.farmerId?.name})
          </span>
        </div>
      ),
    },
    {
      key: 'soilMoisturePercent',
      header: 'Soil Moisture',
      sortable: true,
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#252B26] dark:text-stone-100">
            <Droplet className="h-3.5 w-3.5 text-blue-500" />
            <span>{r.soilMoisturePercent}%</span>
          </div>
          <span className="text-[10px] text-[#687168] dark:text-stone-400">
            {r.soilMoisturePercent < 50 ? 'Depleted (Deficit)' : 'Adequate Field Capacity'}
          </span>
        </div>
      ),
    },
    {
      key: 'waterRequirement',
      header: 'Water Volume & Run-Time',
      render: (r) => (
        <div className="space-y-1">
          <span className="font-bold font-mono text-xs text-[#245C3A] dark:text-emerald-400 block">
            {r.calculatedWaterRequirementLitersPerAcre.toLocaleString()} Liters/ac
          </span>
          <div className="flex items-center gap-1 text-[11px] text-[#687168] dark:text-stone-400">
            <Clock className="h-3 w-3" />
            <span>{Math.floor(r.scheduledRunTimeMinutes / 60)}h {r.scheduledRunTimeMinutes % 60}m run</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status & Execution',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.status === 'completed' ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
              <Check className="h-3 w-3" /> Completed
            </span>
          ) : r.status === 'delayed_due_to_rain' ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 flex items-center gap-1">
              <CloudRain className="h-3 w-3" /> Delayed (Rain)
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleUpdateStatus(r._id, 'completed')}
                className="px-2 py-1 rounded bg-[#245C3A] hover:bg-[#193D2A] text-white text-[10px] font-semibold transition"
                title="Mark Completed"
              >
                Mark Run
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(r._id, 'delayed_due_to_rain')}
                className="p-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 text-[10px]"
                title="Postpone Due to Rain"
              >
                <CloudRain className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const totalWater = schedules.reduce(
    (acc, s) => acc + (Number(s.calculatedWaterRequirementLitersPerAcre) || 0),
    0
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8DF] dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E7EFE6] dark:bg-emerald-950/70 text-[#245C3A] dark:text-emerald-400 border border-[#CFDEC9] dark:border-emerald-800">
              MODULE 11
            </span>
            <span className="text-xs text-[#687168] dark:text-stone-400 font-medium">
              • Evapotranspiration &amp; Irrigation
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#252B26] dark:text-white tracking-tight">
            Irrigation Scheduling &amp; Water Budget
          </h1>
          <p className="text-xs text-[#687168] dark:text-[#a0b5a3] mt-0.5">
            Scientific irrigation timing based on Penman-Monteith ETc, soil moisture depletion, and pump discharge metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Compute Irrigation Run</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Total Water Budget</span>
          <p className="text-2xl font-bold text-[#245C3A] dark:text-emerald-400 mt-1">
            {(totalWater / 1000).toFixed(1)}k <span className="text-xs font-normal text-[#687168]">Liters</span>
          </p>
          <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] mt-1 block">
            Across active land plots
          </span>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Mean Soil Moisture</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-white mt-1">
            {schedules.length
              ? Math.round(
                  schedules.reduce((acc, s) => acc + s.soilMoisturePercent, 0) / schedules.length
                )
              : 45}%
          </p>
          <span className="text-[11px] text-[#245C3A] dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>Optimal root zone condition</span>
          </span>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Pending Schedules</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {schedules.filter((s) => s.status === 'pending').length}
          </p>
          <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] mt-1 block">
            Awaiting pump trigger
          </span>
        </div>

        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Completed Cycles</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {schedules.filter((s) => s.status === 'completed').length}
          </p>
          <span className="text-[11px] text-[#687168] dark:text-[#9bb19f] mt-1 block">
            Logged with water meter
          </span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#162218] rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/40 p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8DF] dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-emerald-300 flex items-center justify-center">
                  <Droplet className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#252B26] dark:text-white">
                    Compute Irrigation Water Schedule
                  </h2>
                  <p className="text-[11px] text-[#687168] dark:text-[#a0b5a3]">
                    Algorithmically calculate pump run time and liter requirements.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#687168] hover:text-[#252B26] dark:text-stone-400 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Select Farmer *
                  </label>
                  <select
                    value={farmerId}
                    onChange={(e) => {
                      setFarmerId(e.target.value);
                      setFarmId('');
                    }}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  >
                    <option value="">-- Choose Registered Farmer --</option>
                    {farmers.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.farmerCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Select Land Parcel *
                  </label>
                  <select
                    value={farmId}
                    onChange={(e) => setFarmId(e.target.value)}
                    required
                    disabled={!farmerId}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  >
                    <option value="">
                      {!farmerId ? '-- Select Farmer First --' : '-- Choose Land Parcel --'}
                    </option>
                    {filteredFarms.map((fm) => (
                      <option key={fm._id} value={fm._id}>
                        {fm.parcelName} ({fm.totalAreaAcres} ac, {fm.irrigationSource})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Crop Name
                  </label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Soil Moisture (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={soilMoisturePercent}
                    onChange={(e) => setSoilMoisturePercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Crop Coefficient (Kc)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={cropCoefficientKc}
                    onChange={(e) => setCropCoefficientKc(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Irrigation Method
                  </label>
                  <select
                    value={irrigationMethod}
                    onChange={(e) => setIrrigationMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  >
                    <option value="drip">Drip Fertigation (90% Efficiency)</option>
                    <option value="sprinkler">Sprinkler System (80% Efficiency)</option>
                    <option value="flood">Surface Basin / Flood (60% Efficiency)</option>
                    <option value="furrow">Furrow Irrigation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                    Pump Discharge Rate (Liters/Hour)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={pumpDischargeRateLph}
                    onChange={(e) => setPumpDischargeRateLph(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3E8DF] dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-[#687168] dark:text-stone-400 hover:bg-[#F1F5EE] dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplet className="h-4 w-4" />}
                  <span>Generate Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        data={schedules}
        columns={columns}
        searchPlaceholder="Search irrigation plans by crop, farmer, or parcel..."
        searchKey="cropName"
        emptyMessage="No irrigation schedules logged yet. Click 'Compute Irrigation Run' to schedule your first precision water budget."
      />
    </div>
  );
}
