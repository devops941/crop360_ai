'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, ShieldCheck, Plus, CheckCircle, ArrowRight, Beaker } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface SeedPlanItem {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string; district: string };
  farmId: { _id: string; parcelName: string; totalAreaAcres: number };
  cropName: string;
  selectedVariety: {
    varietyName: string;
    sourceBreeder: string;
    seedCategory: string;
    germinationRatePercent: number;
    seedRatePerAcreKg: string;
    durationDays: string;
    pestResistanceTraits: string[];
    seedTreatmentAdvisory: {
      fungicideTreatment?: string;
      biofertilizerInoculation?: string;
      soakingDurationHours?: number;
    };
  };
  requiredQuantityKg: number;
  estimatedSeedCostInr: number;
  procurementSource: string;
  status: string;
}

interface SeedCatalogItem {
  cropName: string;
  varietyName: string;
  sourceBreeder: string;
  seedCategory: string;
  germinationRatePercent: number;
  seedRatePerAcreKg: string;
  costPerKgInr: number;
  durationDays: string;
  pestResistanceTraits: string[];
  seedTreatmentAdvisory: {
    fungicideTreatment: string;
    biofertilizerInoculation: string;
    soakingDurationHours: number;
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
}

export default function SeedSelectionPage() {
  const searchParams = useSearchParams();
  const preselectedCrop = searchParams.get('cropName') || '';

  const [catalog, setCatalog] = useState<SeedCatalogItem[]>([]);
  const [plans, setPlans] = useState<SeedPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(preselectedCrop);
  const [selectedVarietyName, setSelectedVarietyName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, planRes, farmRes, farmerRes] = await Promise.all([
        fetch('/api/seed-selection?catalog=true'),
        fetch('/api/seed-selection'),
        fetch('/api/farms'),
        fetch('/api/farmers'),
      ]);

      const catJson = await catRes.json();
      const planJson = await planRes.json();
      const farmJson = await farmRes.json();
      const farmerJson = await farmerRes.json();

      if (catJson.success) setCatalog(catJson.data || []);
      if (planJson.success) setPlans(planJson.data || []);
      if (farmJson.success) setFarms(farmJson.data || []);
      if (farmerJson.success) setFarmers(farmerJson.data || []);
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

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId || !selectedFarmId) {
      alert('Please choose farmer and farm parcel');
      return;
    }

    try {
      setCreating(true);
      const chosenFarm = farms.find((f) => f._id === selectedFarmId);
      const res = await fetch('/api/seed-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarmerId,
          farmId: selectedFarmId,
          cropName: selectedCrop || catalog[0]?.cropName,
          varietyName: selectedVarietyName || undefined,
          acres: chosenFarm?.totalAreaAcres || 1,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        loadData();
      } else {
        alert(json.message || 'Failed to create seed advisory');
      }
    } catch {
      alert('Network error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
              Module 7
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
              Seed Selection & Bio-Treatment Advisory
            </h1>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            TNAU & ICAR certified seed varieties, acreage dosage calculations, and biological seed priming protocols.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Assign Seed Variety Plan
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/20 p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#245C3A]" />
                Prescribe Certified Seed Variety
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold"
              >
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
                  Select Seed Variety from ICAR / TNAU Catalog
                </label>
                <select
                  value={selectedVarietyName}
                  onChange={(e) => {
                    setSelectedVarietyName(e.target.value);
                    const item = catalog.find((c) => c.varietyName === e.target.value);
                    if (item) setSelectedCrop(item.cropName);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                  required
                >
                  <option value="">-- Choose Certified Variety --</option>
                  {catalog.map((c, i) => (
                    <option key={i} value={c.varietyName}>
                      {c.cropName} — {c.varietyName} ({c.durationDays})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Prescribe Seed Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Active Farmer Seed Prescriptions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9]">
          Active Farmer Seed Advisories ({plans.length})
        </h2>

        {loading ? (
          <div className="p-12 text-center text-stone-500">Loading Seed Prescriptions...</div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-stone-200 dark:border-stone-800">
            <Package className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm text-stone-500">
              No seed plans prescribed yet. Click “Assign Seed Variety Plan” to configure certified seed dosage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((p) => (
              <div
                key={p._id}
                className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <span className="text-[11px] font-mono text-[#245C3A] font-bold block uppercase">
                      {p.farmerId?.name} ({p.farmerId?.farmerCode})
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {p.cropName} — {p.selectedVariety.varietyName}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Parcel: {p.farmId?.parcelName} • {p.selectedVariety.sourceBreeder}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200">
                    {p.status}
                  </span>
                </div>

                {/* Seed Dosage & Cost */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Total Quantity</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                      {p.requiredQuantityKg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Est. Cost</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      ₹{p.estimatedSeedCostInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Germination</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                      {p.selectedVariety.germinationRatePercent}%
                    </span>
                  </div>
                </div>

                {/* Biological Seed Treatment Protocol */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-1.5">
                    <Beaker className="w-3.5 h-3.5 text-[#245C3A]" />
                    Bio-Priming & Seed Treatment Protocol
                  </span>
                  {p.selectedVariety.seedTreatmentAdvisory?.fungicideTreatment && (
                    <p className="text-stone-600 dark:text-stone-400">
                      <strong>Bio-Fungicide:</strong> {p.selectedVariety.seedTreatmentAdvisory.fungicideTreatment}
                    </p>
                  )}
                  {p.selectedVariety.seedTreatmentAdvisory?.biofertilizerInoculation && (
                    <p className="text-stone-600 dark:text-stone-400">
                      <strong>Bio-Fertilizer:</strong> {p.selectedVariety.seedTreatmentAdvisory.biofertilizerInoculation}
                    </p>
                  )}
                </div>

                {/* Forward button to Land Prep */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                  <Link
                    href={`/land-prep?farmId=${p.farmId?._id}&cropName=${encodeURIComponent(p.cropName)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#245C3A] hover:underline"
                  >
                    Proceed to Land Preparation (Module 8)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Reference Banner */}
      <div className="p-6 bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#245C3A]" />
          Verified Agricultural University Seed Directory
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {catalog.map((c, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 dark:text-stone-100">{c.varietyName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 uppercase">
                  {c.seedCategory}
                </span>
              </div>
              <p className="text-stone-500">{c.cropName} • {c.durationDays}</p>
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between font-mono">
                <span>Rate: {c.seedRatePerAcreKg}</span>
                <span className="font-bold text-[#245C3A]">₹{c.costPerKgInr}/kg</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
