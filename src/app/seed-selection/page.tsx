'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  ArrowRight,
  Beaker,
  Filter,
  Sparkles,
  Info,
  Trash2,
  RefreshCw,
} from 'lucide-react';
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
  _id?: string;
  cropName: string;
  varietyName: string;
  category: 'cereal' | 'pulse' | 'oilseed' | 'commercial' | 'horticulture' | 'vegetable';
  sourceBreeder: string;
  seedCategory: 'certified' | 'foundation' | 'hybrid' | 'traditional_desi';
  germinationRatePercent: number;
  seedRatePerAcreKg: string;
  seedRateKgNumber: number;
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
  district: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: string | { _id: string };
  totalAreaAcres: number;
}

interface CropPlanRecommendation {
  _id: string;
  farmerId: { _id: string } | string;
  farmId: { _id: string } | string;
  selectedCrop: string;
  recommendations?: { cropName: string; suitabilityScore: number }[];
}

export default function SeedSelectionPage() {
  const searchParams = useSearchParams();
  const preselectedCrop = searchParams.get('cropName') || '';
  const queryFarmerId = searchParams.get('farmerId') || '';
  const queryFarmId = searchParams.get('farmId') || '';

  const [catalog, setCatalog] = useState<SeedCatalogItem[]>([]);
  const [plans, setPlans] = useState<SeedPlanItem[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlanRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterFarmerId, setFilterFarmerId] = useState(queryFarmerId);
  const [filterFarmId, setFilterFarmId] = useState(queryFarmId);

  // Sync if query parameters change
  useEffect(() => {
    if (queryFarmerId) setFilterFarmerId(queryFarmerId);
    if (queryFarmId) setFilterFarmId(queryFarmId);
  }, [queryFarmerId, queryFarmId]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);

  // Prescription Form state
  const [selectedFarmerId, setSelectedFarmerId] = useState(queryFarmerId);
  const [selectedFarmId, setSelectedFarmId] = useState(queryFarmId);
  const [selectedCrop, setSelectedCrop] = useState(preselectedCrop);
  const [selectedVarietyName, setSelectedVarietyName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const queryStr = typeof window !== 'undefined' ? window.location.search : '';
      const [catRes, planRes, farmRes, farmerRes, cropPlanRes] = await Promise.all([
        fetch('/api/seed-catalog'),
        fetch(`/api/seed-selection${queryStr}`),
        fetch('/api/farms'),
        fetch('/api/farmers'),
        fetch('/api/crop-recommendations'),
      ]);

      const catJson = await catRes.json();
      const planJson = await planRes.json();
      const farmJson = await farmRes.json();
      const farmerJson = await farmerRes.json();
      const cropPlanJson = await cropPlanRes.json();

      if (catJson.success) setCatalog(catJson.data || []);
      if (planJson.success) setPlans(planJson.data || []);
      if (farmJson.success) setFarms(farmJson.data || []);
      if (farmerJson.success) setFarmers(farmerJson.data || []);
      if (cropPlanJson.success) setCropPlans(cropPlanJson.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Farms filtered by selected farmer in modal
  const filteredFarms = farms.filter((fm) => {
    const fId = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
    return !selectedFarmerId || fId === selectedFarmerId;
  });

  // Farms available in top filter bar
  const availableFilterFarms = farms.filter((fm) => {
    const fId = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
    return !filterFarmerId || fId === filterFarmerId;
  });

  // Active plans matching top filter
  const displayedPlans = plans.filter((p) => {
    const fId = typeof p.farmerId === 'object' ? p.farmerId?._id : p.farmerId;
    const farmId = typeof p.farmId === 'object' ? p.farmId?._id : p.farmId;
    if (filterFarmerId && fId !== filterFarmerId) return false;
    if (filterFarmId && farmId !== filterFarmId) return false;
    return true;
  });

  // Unique crop list from catalog
  const uniqueCrops = Array.from(new Set(catalog.map((c) => c.cropName))).sort();

  // Varieties available for selected crop in modal
  const varietiesForSelectedCrop = catalog.filter(
    (c) =>
      !selectedCrop ||
      c.cropName.toLowerCase().includes(selectedCrop.toLowerCase()) ||
      selectedCrop.toLowerCase().includes(c.cropName.toLowerCase())
  );

  // Active selected variety object in modal
  const activeVarietyItem =
    varietiesForSelectedCrop.find((v) => v.varietyName === selectedVarietyName) ||
    varietiesForSelectedCrop[0] ||
    catalog[0];

  // Active farm parcel in modal
  const activeFarmParcel = farms.find((f) => f._id === selectedFarmId);
  const activeAcreage = activeFarmParcel?.totalAreaAcres || 1;
  const calculatedSeedKg = activeVarietyItem
    ? Number((activeVarietyItem.seedRateKgNumber * activeAcreage).toFixed(1))
    : 0;
  const calculatedSeedCost = activeVarietyItem
    ? Math.round(calculatedSeedKg * activeVarietyItem.costPerKgInr)
    : 0;

  // Recommended crop from Module 6 (Crop Suitability) for active filter
  const activeCropPlan = cropPlans.find((cp) => {
    const fId = typeof cp.farmerId === 'object' ? cp.farmerId._id : cp.farmerId;
    const fmId = typeof cp.farmId === 'object' ? cp.farmId._id : cp.farmId;
    if (filterFarmerId && fId !== filterFarmerId) return false;
    if (filterFarmId && fmId !== filterFarmId) return false;
    return true;
  });
  const recommendedCropName =
    activeCropPlan?.selectedCrop || activeCropPlan?.recommendations?.[0]?.cropName;

  // Handle Prescription Submit
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
          cropName: selectedCrop || activeVarietyItem?.cropName,
          varietyName: selectedVarietyName || activeVarietyItem?.varietyName,
          acres: chosenFarm?.totalAreaAcres || 1,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        await loadData();
      } else {
        alert(json.message || 'Failed to create seed advisory');
      }
    } catch {
      alert('Network error while saving seed plan');
    } finally {
      setCreating(false);
    }
  };

  // Direct Apply to Active Farm
  const handleApplySeedToFarm = async (seed: SeedCatalogItem) => {
    const targetFarmerId = filterFarmerId || farmers[0]?._id;
    const targetFarms = farms.filter((fm) => {
      const fId = typeof fm.farmerId === 'object' ? fm.farmerId._id : fm.farmerId;
      return fId === targetFarmerId;
    });
    const targetFarm = filterFarmId
      ? farms.find((f) => f._id === filterFarmId)
      : targetFarms[0];

    if (!targetFarmerId || !targetFarm) {
      setSelectedCrop(seed.cropName);
      setSelectedVarietyName(seed.varietyName);
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/seed-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: targetFarmerId,
          farmId: targetFarm._id,
          cropName: seed.cropName,
          varietyName: seed.varietyName,
          acres: targetFarm.totalAreaAcres || 1,
        }),
      });

      const json = await res.json();
      if (json.success) {
        await loadData();
      } else {
        alert(json.message || 'Failed to prescribe seed');
      }
    } catch {
      alert('Failed to prescribe seed');
    } finally {
      setLoading(false);
    }
  };

  // Delete Seed Plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to remove this seed prescription?')) return;
    try {
      const res = await fetch(`/api/seed-selection?id=${planId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert(json.message || 'Failed to delete');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-[#193D2A] dark:bg-emerald-950/60 dark:text-emerald-300">
              Module 7 • Agronomic Inputs
            </span>
            <span className="text-xs text-stone-400">• ICAR & TNAU Certified</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
            Seed Selection & Bio-Treatment Advisory
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Certified university seed varieties, dynamic acreage seed rates, germination tracking, and biological priming protocols.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/seed-catalog"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white hover:bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-xs transition"
          >
            <Package className="w-3.5 h-3.5 text-[#245C3A]" />
            Seed Catalog & Variety Feed
          </Link>

          <button
            onClick={() => {
              if (filterFarmerId) setSelectedFarmerId(filterFarmerId);
              if (filterFarmId) setSelectedFarmId(filterFarmId);
              if (recommendedCropName) setSelectedCrop(recommendedCropName);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            Assign Seed Variety Plan
          </button>
        </div>
      </div>

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
                  {f.name} ({f.farmerCode}) • {f.district}
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

        <div className="flex items-center gap-3 text-xs text-stone-500 font-medium shrink-0">
          {recommendedCropName && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
              Recommended: <strong>{recommendedCropName}</strong>
            </span>
          )}
          <span>
            Showing <strong className="text-[#245C3A]">{displayedPlans.length}</strong> of {plans.length} seed plans
          </span>
        </div>
      </div>

      {/* Main Grid: Active Farmer Seed Prescriptions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#245C3A]" />
            Active Farmer Seed Advisories ({displayedPlans.length})
          </h2>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500">Loading dynamic seed advisories...</div>
        ) : displayedPlans.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/25 space-y-4">
            <Package className="w-12 h-12 text-stone-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                {filterFarmerId ? 'No Seed Plan Prescribed for Selected Farmer' : 'No Seed Plans Prescribed Yet'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                {recommendedCropName ? (
                  <>
                    Soil suitability engine evaluated this land parcel for{' '}
                    <strong className="text-[#245C3A]">{recommendedCropName}</strong>. You can prescribe certified seeds with one click below or assign manually.
                  </>
                ) : (
                  'Assign certified seed varieties to calculate seed dosage, cost estimates, and priming treatments.'
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              {recommendedCropName && (
                <button
                  onClick={() => {
                    const match =
                      catalog.find(
                        (c) =>
                          c.cropName.toLowerCase().includes(recommendedCropName.toLowerCase()) ||
                          recommendedCropName.toLowerCase().includes(c.cropName.toLowerCase())
                      ) || catalog[0];
                    handleApplySeedToFarm(match);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto-Prescribe for {recommendedCropName}
                </button>
              )}
              <button
                onClick={() => {
                  if (filterFarmerId) setSelectedFarmerId(filterFarmerId);
                  if (filterFarmId) setSelectedFarmId(filterFarmId);
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#245C3A] text-white shadow"
              >
                <Plus className="w-4 h-4" />
                Select Seed Variety Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedPlans.map((p) => (
              <div
                key={p._id}
                className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/15 p-6 shadow-sm space-y-4 hover:border-[#245C3A]/30 transition"
              >
                <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <span className="text-[11px] font-mono text-[#245C3A] font-bold block uppercase">
                      {p.farmerId?.name} ({p.farmerId?.farmerCode}) • {p.farmerId?.district}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {p.cropName} — {p.selectedVariety?.varietyName}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Parcel: <strong>{p.farmId?.parcelName}</strong> ({p.farmId?.totalAreaAcres} Acres) • Breeder:{' '}
                      {p.selectedVariety?.sourceBreeder}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200">
                      {p.status}
                    </span>
                    <button
                      onClick={() => handleDeletePlan(p._id)}
                      title="Delete prescription"
                      className="text-stone-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Seed Dosage & Cost */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Total Quantity</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono text-sm">
                      {p.requiredQuantityKg} kg
                    </span>
                    <span className="block text-[10px] text-stone-400 mt-0.5">
                      ({p.selectedVariety?.seedRatePerAcreKg}/ac)
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Est. Cost</span>
                    <span className="font-bold text-[#245C3A] font-mono text-sm">
                      ₹{p.estimatedSeedCostInr?.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-stone-400 mt-0.5">
                      for {p.farmId?.totalAreaAcres} Acres
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Germination</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono text-sm">
                      {p.selectedVariety?.germinationRatePercent}%
                    </span>
                    <span className="block text-[10px] text-stone-400 mt-0.5">
                      {p.selectedVariety?.durationDays}
                    </span>
                  </div>
                </div>

                {/* Biological Seed Treatment Protocol */}
                <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-1.5 text-xs">
                  <span className="font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-1.5">
                    <Beaker className="w-3.5 h-3.5 text-[#245C3A]" />
                    Bio-Priming & Seed Treatment Protocol
                  </span>
                  {p.selectedVariety?.seedTreatmentAdvisory?.fungicideTreatment && (
                    <p className="text-stone-700 dark:text-stone-300">
                      <strong>Bio-Fungicide:</strong> {p.selectedVariety.seedTreatmentAdvisory.fungicideTreatment}
                    </p>
                  )}
                  {p.selectedVariety?.seedTreatmentAdvisory?.biofertilizerInoculation && (
                    <p className="text-stone-700 dark:text-stone-300">
                      <strong>Bio-Fertilizer:</strong>{' '}
                      {p.selectedVariety.seedTreatmentAdvisory.biofertilizerInoculation}
                    </p>
                  )}
                  {p.selectedVariety?.pestResistanceTraits?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.selectedVariety.pestResistanceTraits.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                        >
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Forward button to Land Prep */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    Source: {p.procurementSource || 'TNAU / PACS Depot'}
                  </span>
                  <Link
                    href={`/land-prep?farmerId=${p.farmerId?._id || ''}&farmId=${p.farmId?._id || ''}&cropName=${encodeURIComponent(p.cropName)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow transition"
                  >
                    Proceed to Land Preparation
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Link Banner to Seed Master Catalog */}
      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Package className="w-4 h-4 text-[#245C3A] shrink-0" />
          <span className="text-stone-600 dark:text-stone-300">
            Want to explore all {catalog.length} certified varieties, feed custom seeds, or update prices?
          </span>
        </div>
        <Link
          href="/seed-catalog"
          className="inline-flex items-center gap-1.5 font-bold text-[#245C3A] dark:text-emerald-400 hover:underline shrink-0"
        >
          Open Seed Catalog & Variety Feed
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Modal: Assign Seed Variety Plan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/20 p-6 md:p-8 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                      {f.name} ({f.farmerCode}) • {f.district}
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

              {/* Dynamic Crop Select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Target Crop
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => {
                    setSelectedCrop(e.target.value);
                    setSelectedVarietyName('');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                  required
                >
                  <option value="">-- Choose Crop --</option>
                  {uniqueCrops.map((cr, idx) => (
                    <option key={idx} value={cr}>
                      {cr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Variety Select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Certified University Seed Variety
                </label>
                <select
                  value={selectedVarietyName}
                  onChange={(e) => setSelectedVarietyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
                  required
                >
                  <option value="">-- Choose Variety --</option>
                  {varietiesForSelectedCrop.map((c, i) => (
                    <option key={i} value={c.varietyName}>
                      {c.varietyName} ({c.seedCategory} • ₹{c.costPerKgInr}/kg • {c.durationDays})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Acreage Calculation Preview */}
              {activeVarietyItem && (
                <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300 block">
                    ⚡ Live Acreage & Cost Calculation:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-stone-600 dark:text-stone-400">
                    <div>
                      Land Area: <strong className="text-stone-900 dark:text-white">{activeAcreage} Acres</strong>
                    </div>
                    <div>
                      Seed Rate: <strong className="text-stone-900 dark:text-white">{activeVarietyItem.seedRatePerAcreKg}</strong>
                    </div>
                    <div>
                      Required Quantity:{' '}
                      <strong className="text-[#245C3A]">{calculatedSeedKg} kg</strong>
                    </div>
                    <div>
                      Est. Total Cost:{' '}
                      <strong className="text-[#245C3A]">₹{calculatedSeedCost.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500">
                    Breeder: {activeVarietyItem.sourceBreeder}
                  </div>
                </div>
              )}

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
    </div>
  );
}
