'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, Plus, CheckCircle, Clock, MapPin, Layers } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface SowingRecordItem {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string; district: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres: number };
  cropName: string;
  varietyName: string;
  sowingDate: string;
  plantingMethod: string;
  spacingCm: { rowToRowCm: number; plantToPlantCm: number };
  plantPopulationPerAcre: number;
  nurseryAgeDays?: number;
  targetHarvestDateEstimated: string;
  actualSeedRateUsedKg: number;
  depthOfSowingCm: number;
  status: string;
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

export default function SowingPage() {
  const searchParams = useSearchParams();
  const preselectedFarmId = searchParams.get('farmId');
  const preselectedCrop = searchParams.get('cropName') || 'Paddy (Rice / Samba / Kuruvai)';

  const [records, setRecords] = useState<SowingRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState(preselectedFarmId || '');
  const [cropName, setCropName] = useState(preselectedCrop);
  const [varietyName, setVarietyName] = useState('CO 51');
  const [plantingMethod, setPlantingMethod] = useState('transplanting');
  const [rowToRowCm, setRowToRowCm] = useState(20);
  const [plantToPlantCm, setPlantToPlantCm] = useState(15);
  const [nurseryAgeDays, setNurseryAgeDays] = useState(21);
  const [seedRateKg, setSeedRateKg] = useState(18);
  const [durationDays, setDurationDays] = useState(115);
  const [saving, setSaving] = useState(false);

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
          nurseryAgeDays,
          actualSeedRateUsedKg: seedRateKg,
          durationDays,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
              Module 9
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
              Sowing & Planting Management
            </h1>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Field establishment tracking, spacing geometry (row × plant cm), plant population density, and harvest countdown.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Log Sowing / Planting Event
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/20 p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#245C3A]" />
                Record Sowing / Planting Event
              </h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Farmer
                </label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => {
                    setSelectedFarmerId(e.target.value);
                    setSelectedFarmId('');
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
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
                  Land Parcel
                </label>
                <select
                  value={selectedFarmId}
                  disabled={!selectedFarmerId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
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
                    Crop Name
                  </label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Seed Variety
                  </label>
                  <input
                    type="text"
                    value={varietyName}
                    onChange={(e) => setVarietyName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
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
                    onChange={(e) => setPlantingMethod(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                  >
                    <option value="transplanting">Transplanting (Nursery seedlings)</option>
                    <option value="direct_seeding">Direct Seeding (DSR / Drill)</option>
                    <option value="dibbling">Dibbling (Hand sowing)</option>
                    <option value="broadcasting">Broadcasting</option>
                    <option value="drip_fertigation_line">Drip Raised Bed Planting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 120)}
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                  />
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
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
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
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                  />
                </div>
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
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow disabled:opacity-50"
                >
                  {saving ? 'Logging...' : 'Confirm Sowing Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Records List */}
      {loading ? (
        <div className="p-12 text-center text-stone-500">Loading Sowing Records...</div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/20">
          <Calendar className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">No Sowing Events Recorded</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            Record actual field sowing to calculate target plant populations and initiate crop lifecycle tracking.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] text-white text-sm font-semibold shadow"
          >
            <Plus className="w-4 h-4" />
            Log Sowing Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map((rec) => {
            const harvestDate = new Date(rec.targetHarvestDateEstimated);
            const now = new Date();
            const daysRemaining = Math.max(0, Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            return (
              <div
                key={rec._id}
                className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <span className="text-[11px] font-mono text-[#245C3A] font-bold block uppercase">
                      {rec.farmerId?.name} ({rec.farmerId?.district})
                    </span>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                      {rec.cropName} — {rec.varietyName}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Parcel: {rec.farmId?.parcelName} (Survey #{rec.farmId?.surveyNumber})
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200">
                    {rec.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Geometry & Density Grid */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Geometry</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                      {rec.spacingCm.rowToRowCm} × {rec.spacingCm.plantToPlantCm} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Plant Population</span>
                    <span className="font-bold text-[#245C3A] font-mono">
                      {rec.plantPopulationPerAcre.toLocaleString('en-IN')} / ac
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Method</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 capitalize">
                      {rec.plantingMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Harvest Projection */}
                <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-stone-500 block text-[10px]">Estimated Harvest Date</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {harvestDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                    {daysRemaining} Days Remaining
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
