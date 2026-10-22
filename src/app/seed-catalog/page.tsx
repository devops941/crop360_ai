'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Building2,
  Trash2,
  Edit2,
  Sprout,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  LayoutGrid,
  List,
  Beaker,
  Clock,
  Coins,
} from 'lucide-react';

interface SeedItem {
  _id: string;
  cropName: string;
  varietyName: string;
  category: 'cereal' | 'pulse' | 'oilseed' | 'commercial' | 'horticulture' | 'vegetable';
  sourceBreeder: string;
  seedCategory: 'certified' | 'foundation' | 'hybrid' | 'traditional_desi';
  germinationRatePercent: number;
  seedRatePerAcreKg: string;
  seedRateKgNumber: number;
  costPerKgInr: number;
  stockAvailableKg?: number;
  durationDays: string;
  pestResistanceTraits: string[];
  seedTreatmentAdvisory: {
    fungicideTreatment: string;
    biofertilizerInoculation: string;
    soakingDurationHours: number;
  };
  isActive: boolean;
  createdAt?: string;
}

export default function SeedCatalogPage() {
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeedType, setSelectedSeedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingSeed, setEditingSeed] = useState<SeedItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State - Empty by default so user can fill in fresh data
  const initialFormState = {
    cropName: '',
    varietyName: '',
    category: 'cereal' as SeedItem['category'],
    sourceBreeder: '',
    seedCategory: 'certified' as SeedItem['seedCategory'],
    germinationRatePercent: '' as unknown as number,
    seedRatePerAcreKg: '',
    seedRateKgNumber: '' as unknown as number,
    costPerKgInr: '' as unknown as number,
    stockAvailableKg: '' as unknown as number,
    durationDays: '',
    pestResistanceTraits: '',
    fungicideTreatment: '',
    biofertilizerInoculation: '',
    soakingDurationHours: '' as unknown as number,
  };

  const [form, setForm] = useState(initialFormState);

  const loadSeeds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seed-catalog');
      const json = await res.json();
      if (json.success) {
        setSeeds(json.data || []);
      }
    } catch {
      console.error('Failed to load seeds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeeds();
  }, [loadSeeds]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingSeed(null);
    setForm(initialFormState);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (seed: SeedItem) => {
    setEditingSeed(seed);
    setForm({
      cropName: seed.cropName,
      varietyName: seed.varietyName,
      category: seed.category || 'cereal',
      sourceBreeder: seed.sourceBreeder,
      seedCategory: seed.seedCategory,
      germinationRatePercent: seed.germinationRatePercent,
      seedRatePerAcreKg: seed.seedRatePerAcreKg,
      seedRateKgNumber: seed.seedRateKgNumber,
      costPerKgInr: seed.costPerKgInr,
      stockAvailableKg: seed.stockAvailableKg || 120,
      durationDays: seed.durationDays,
      pestResistanceTraits: (seed.pestResistanceTraits || []).join(', '),
      fungicideTreatment: seed.seedTreatmentAdvisory?.fungicideTreatment || '',
      biofertilizerInoculation: seed.seedTreatmentAdvisory?.biofertilizerInoculation || '',
      soakingDurationHours: seed.seedTreatmentAdvisory?.soakingDurationHours || 0,
    });
    setShowModal(true);
  };

  // Save (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cropName || !form.varietyName || !form.sourceBreeder) {
      alert('Please fill all mandatory fields (Crop Name, Variety Name, Breeder)');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        cropName: form.cropName.trim(),
        varietyName: form.varietyName.trim(),
        category: form.category,
        sourceBreeder: form.sourceBreeder.trim(),
        seedCategory: form.seedCategory,
        germinationRatePercent: form.germinationRatePercent ? Number(form.germinationRatePercent) : 85,
        seedRatePerAcreKg: form.seedRatePerAcreKg.trim() || `${form.seedRateKgNumber || 10} kg`,
        seedRateKgNumber: Number(form.seedRateKgNumber) || parseFloat(form.seedRatePerAcreKg) || 10,
        costPerKgInr: Number(form.costPerKgInr) || 0,
        stockAvailableKg: form.stockAvailableKg ? Number(form.stockAvailableKg) : 120,
        durationDays: form.durationDays.trim() || '100 - 120 days',
        pestResistanceTraits: form.pestResistanceTraits
          ? form.pestResistanceTraits
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        seedTreatmentAdvisory: {
          fungicideTreatment: form.fungicideTreatment || '',
          biofertilizerInoculation: form.biofertilizerInoculation || '',
          soakingDurationHours: form.soakingDurationHours ? Number(form.soakingDurationHours) : 0,
        },
      };

      const url = '/api/seed-catalog';
      const method = editingSeed ? 'PUT' : 'POST';
      const body = editingSeed ? { _id: editingSeed._id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        await loadSeeds();
      } else {
        alert(json.message || 'Failed to save seed variety');
      }
    } catch {
      alert('Network error while saving seed');
    } finally {
      setSaving(false);
    }
  };

  // Delete Seed
  const handleDelete = async (id: string, varietyName: string) => {
    if (!confirm(`Are you sure you want to delete seed variety: "${varietyName}"?`)) return;

    try {
      const res = await fetch(`/api/seed-catalog?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        loadSeeds();
      } else {
        alert(json.message || 'Failed to delete seed');
      }
    } catch {
      alert('Network error while deleting seed');
    }
  };

  // Filtered List
  const filteredSeeds = seeds.filter((s) => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    if (selectedSeedType !== 'all' && s.seedCategory !== selectedSeedType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        s.cropName.toLowerCase().includes(q) ||
        s.varietyName.toLowerCase().includes(q) ||
        s.sourceBreeder.toLowerCase().includes(q) ||
        (s.pestResistanceTraits || []).some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Unique Crops
  const uniqueCrops = Array.from(new Set(seeds.map((s) => s.cropName))).sort();
  const uniqueBreeders = Array.from(new Set(seeds.map((s) => s.sourceBreeder)));

  return (
    <div className="space-y-6">


      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-[#193D2A] dark:bg-emerald-950/60 dark:text-emerald-300">
              Seed Master Repository
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
            Available Seed Catalog & Stock Entry
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Feed, update, and manage official university seed varieties, godown stock, acreage dosage rates, and biological priming protocols.
          </p>
        </div>

        <div className="flex items-center gap-2">
       

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
             New Seed Variety Entry
          </button>
        </div>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a231d] border border-[#245C3A]/15 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
            Total Seed Varieties
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#193D2A] dark:text-[#E8F0E9]">
              {seeds.length}
            </span>
            <Package className="w-5 h-5 text-[#245C3A]" />
          </div>
          <span className="text-[11px] text-stone-500 block">Active certified varieties</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a231d] border border-[#245C3A]/15 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
            Crops Covered
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#193D2A] dark:text-[#E8F0E9]">
              {uniqueCrops.length}
            </span>
            <Sprout className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] text-stone-500 block">Paddy, Cotton, Maize, etc.</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a231d] border border-[#245C3A]/15 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
            Breeding Stations
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#193D2A] dark:text-[#E8F0E9]">
              {uniqueBreeders.length}
            </span>
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-[11px] text-stone-500 block">TNAU, ICAR, ANGRAU, IIHR</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a231d] border border-[#245C3A]/15 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
            Min. Germination Avg
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#193D2A] dark:text-[#E8F0E9]">
              {seeds.length > 0
                ? Math.round(
                    seeds.reduce((acc, s) => acc + (s.germinationRatePercent || 85), 0) / seeds.length
                  )
                : 88}
              %
            </span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[11px] text-stone-500 block">Certified university benchmark</span>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white dark:bg-[#1a231d] p-4 rounded-2xl border border-[#245C3A]/15 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search seed by crop, variety name, breeder, traits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Seed Category Dropdown */}
            <select
              value={selectedSeedType}
              onChange={(e) => setSelectedSeedType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-300"
            >
              <option value="all">All Seed Types</option>
              <option value="certified">Certified</option>
              <option value="hybrid">Hybrid</option>
              <option value="foundation">Foundation</option>
              <option value="traditional_desi">Traditional / Desi</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden bg-stone-50 dark:bg-stone-900">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#245C3A] text-white' : 'text-stone-500 hover:text-stone-800'}`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition ${viewMode === 'table' ? 'bg-[#245C3A] text-white' : 'text-stone-500 hover:text-stone-800'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          
          </div>
        </div>

      </div>

      {/* Main Seed Records List */}
      {loading ? (
        <div className="p-12 text-center text-stone-500">Loading Seed Catalog...</div>
      ) : filteredSeeds.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/25 space-y-3">
          <Package className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No Seed Varieties Found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            No seed varieties match your search or category filter. Try clearing filters or feed a new seed variety.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#245C3A] text-white text-xs font-semibold shadow"
          >
            <Plus className="w-4 h-4" />
            Feed New Seed Variety
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSeeds.map((s) => (
            <div
              key={s._id}
              className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/15 p-5 shadow-sm space-y-4 hover:border-[#245C3A]/40 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#245C3A] block">
                      {s.cropName}
                    </span>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base leading-snug">
                      {s.varietyName}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                    {s.seedCategory}
                  </span>
                </div>

                <p className="text-xs text-stone-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{s.sourceBreeder}</span>
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-1.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[9px] uppercase font-bold">Seed Rate</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono text-[11px]">
                      {s.seedRatePerAcreKg}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px] uppercase font-bold">Cost / Kg</span>
                    <span className="font-bold text-[#245C3A] font-mono text-[11px]">
                      ₹{s.costPerKgInr}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px] uppercase font-bold">Germination</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono text-[11px]">
                      {s.germinationRatePercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px] uppercase font-bold">In Stock</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                      {s.stockAvailableKg || 120} kg
                    </span>
                  </div>
                </div>

                {/* Duration & Traits */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>Duration: {s.durationDays}</span>
                  </div>

                  {s.pestResistanceTraits?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {s.pestResistanceTraits.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                        >
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bio-Treatment protocol snippet */}
                  {s.seedTreatmentAdvisory?.fungicideTreatment && (
                    <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] text-stone-600 dark:text-stone-300 space-y-0.5">
                      <span className="font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-1">
                        <Beaker className="w-3 h-3 text-[#245C3A]" />
                        Bio-Priming:
                      </span>
                      <p className="line-clamp-2">{s.seedTreatmentAdvisory.fungicideTreatment}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 text-stone-600 dark:text-stone-300"
                    title="Edit seed"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id, s.varietyName)}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-red-50 text-stone-400 hover:text-red-600"
                    title="Delete seed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Link
                  href={`/seed-selection?cropName=${encodeURIComponent(s.cropName)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#245C3A] text-[#245C3A] hover:text-white border border-[#245C3A]/25 text-xs font-semibold shadow-xs transition"
                >
                  <Sparkles className="w-3 h-3" />
                  Prescribe in Advisory
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/15 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold uppercase text-stone-500">
              <tr>
                <th className="p-3.5">Crop & Variety</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Breeder / Institute</th>
                <th className="p-3.5">Seed Rate / Acre</th>
                <th className="p-3.5">Cost / Kg</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Germination</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredSeeds.map((s) => (
                <tr key={s._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3.5">
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {s.varietyName}
                    </span>
                    <span className="text-[10px] text-[#245C3A] font-medium">{s.cropName}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700">
                      {s.seedCategory}
                    </span>
                  </td>
                  <td className="p-3.5 text-stone-600 dark:text-stone-300 max-w-[200px] truncate">
                    {s.sourceBreeder}
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-stone-800 dark:text-stone-200">
                    {s.seedRatePerAcreKg}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-[#245C3A]">
                    ₹{s.costPerKgInr}/kg
                  </td>
                  <td className="p-3.5 text-stone-600 dark:text-stone-400">{s.durationDays}</td>
                  <td className="p-3.5 font-mono font-bold text-stone-800 dark:text-stone-200">
                    {s.germinationRatePercent}%
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/seed-selection?cropName=${encodeURIComponent(s.cropName)}`}
                        className="p-1.5 rounded-lg text-[#245C3A] hover:bg-emerald-50"
                        title="Prescribe to Farmer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id, s.varietyName)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feed / Add / Edit Seed Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/20 p-6 md:p-8 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#245C3A]" />
                {editingSeed ? 'Edit Seed Variety Record' : 'Feed / Register New Seed Variety'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paddy (Rice / Samba / Kuruvai)"
                    value={form.cropName}
                    onChange={(e) => setForm({ ...form, cropName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
                  />
              
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Variety Name & Breeder Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CO 51 or RCH 659 BG II"
                    value={form.varietyName}
                    onChange={(e) => setForm({ ...form, varietyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Crop Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                  >
                    <option value="cereal">Cereal</option>
                    <option value="commercial">Commercial / Cash</option>
                    <option value="pulse">Pulse</option>
                    <option value="oilseed">Oilseed</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="horticulture">Horticulture / Spices</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Seed Certification Category
                  </label>
                  <select
                    value={form.seedCategory}
                    onChange={(e) => setForm({ ...form, seedCategory: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                  >
                    <option value="certified">Certified</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="foundation">Foundation</option>
                    <option value="traditional_desi">Traditional / Desi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Breeder / University Station *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TNAU Coimbatore / ICAR-CICR"
                    value={form.sourceBreeder}
                    onChange={(e) => setForm({ ...form, sourceBreeder: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                  />
                </div>
              </div>

              {/* Seed Dosage & Commercials */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Seed Rate (kg/acre) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 18"
                    value={form.seedRateKgNumber === 0 || form.seedRateKgNumber ? form.seedRateKgNumber : ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        seedRateKgNumber: e.target.value === '' ? ('' as unknown as number) : parseFloat(e.target.value),
                        seedRatePerAcreKg: e.target.value ? `${e.target.value} kg` : '',
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Price per Kg (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 55"
                    value={form.costPerKgInr === 0 || form.costPerKgInr ? form.costPerKgInr : ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        costPerKgInr: e.target.value === '' ? ('' as unknown as number) : parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Available Stock (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={form.stockAvailableKg === 0 || form.stockAvailableKg ? form.stockAvailableKg : ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stockAvailableKg: e.target.value === '' ? ('' as unknown as number) : parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Duration (Days) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 105 - 110 days"
                    value={form.durationDays}
                    onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                    Min Germination (%)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 85"
                    value={form.germinationRatePercent === 0 || form.germinationRatePercent ? form.germinationRatePercent : ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        germinationRatePercent: e.target.value === '' ? ('' as unknown as number) : parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-600 dark:text-stone-400 mb-1">
                  Pest & Disease Resistance Traits (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blast tolerant, Bacterial Leaf Blight resistant, Non-lodging"
                  value={form.pestResistanceTraits}
                  onChange={(e) => setForm({ ...form, pestResistanceTraits: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                />
              </div>

              {/* Bio-Priming Protocol */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                <span className="font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-1.5">
                  <Beaker className="w-4 h-4 text-[#245C3A]" />
                  Biological Seed Priming & Bio-Treatment Protocol
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Bio-Fungicide Treatment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pseudomonas fluorescens @ 10g/kg seed"
                      value={form.fungicideTreatment}
                      onChange={(e) => setForm({ ...form, fungicideTreatment: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Bio-Fertilizer Inoculation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Azospirillum & Phosphobacteria @ 600g/acre seed rate"
                      value={form.biofertilizerInoculation}
                      onChange={(e) =>
                        setForm({ ...form, biofertilizerInoculation: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                    />
                  </div>
                </div>

                <div className="w-48">
                  <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                    Soaking Duration (Hours)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={form.soakingDurationHours === 0 || form.soakingDurationHours ? form.soakingDurationHours : ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        soakingDurationHours: e.target.value === '' ? ('' as unknown as number) : parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono"
                  />
                </div>
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
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow disabled:opacity-50"
                >
                  {saving
                    ? 'Saving Seed...'
                    : editingSeed
                    ? 'Update Seed Variety'
                    : 'Feed & Save Seed Variety'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
