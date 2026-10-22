'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  Plus,
  Search,
  Building2,
  Trash2,
  Edit2,
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
  Package,
  AlertTriangle,
  Scale,
  X,
  Droplet,
} from 'lucide-react';
import { toast } from 'react-toastify';

export interface FertilizerItemData {
  _id: string;
  name: string;
  category: 'primary_npk' | 'secondary_micronutrient' | 'water_soluble' | 'bio_organic' | 'soil_amendment';
  npkRatio?: string;
  manufacturer: string;
  bagSizeKg: number;
  unit: 'bag' | 'kg' | 'liter' | 'bottle';
  pricePerUnitInr: number;
  subsidizedPriceInr?: number;
  stockAvailableUnits: number;
  suitableCrops: string[];
  applicationMethod: 'broadcasting' | 'fertigation' | 'foliar_spray' | 'soil_incorporation' | 'seed_treatment';
  dosageGuide: string;
  batchNumber?: string;
  isActive: boolean;
  createdAt?: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  primary_npk: { label: 'Primary NPK', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  water_soluble: { label: 'Water Soluble', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  secondary_micronutrient: { label: 'Micronutrient', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  bio_organic: { label: 'Bio & Organic', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  soil_amendment: { label: 'Soil Amendment', color: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700' },
};

export default function FertilizerCatalogPage() {
  const [fertilizers, setFertilizers] = useState<FertilizerItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FertilizerItemData | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    category: 'primary_npk' as FertilizerItemData['category'],
    npkRatio: '',
    manufacturer: '',
    bagSizeKg: 50,
    unit: 'bag' as FertilizerItemData['unit'],
    pricePerUnitInr: '' as unknown as number,
    subsidizedPriceInr: '' as unknown as number,
    stockAvailableUnits: '' as unknown as number,
    suitableCrops: '',
    applicationMethod: 'broadcasting' as FertilizerItemData['applicationMethod'],
    dosageGuide: '',
    batchNumber: '',
  };

  const [form, setForm] = useState(initialForm);

  const loadFertilizers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fertilizers');
      const json = await res.json();
      if (json.success) {
        setFertilizers(json.data || []);
      }
    } catch {
      toast.error('Failed to load available fertilizer stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFertilizers();
  }, [loadFertilizers]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (item: FertilizerItemData) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      npkRatio: item.npkRatio || '',
      manufacturer: item.manufacturer,
      bagSizeKg: item.bagSizeKg || 50,
      unit: item.unit || 'bag',
      pricePerUnitInr: item.pricePerUnitInr,
      subsidizedPriceInr: item.subsidizedPriceInr || ('' as unknown as number),
      stockAvailableUnits: item.stockAvailableUnits,
      suitableCrops: (item.suitableCrops || []).join(', '),
      applicationMethod: item.applicationMethod,
      dosageGuide: item.dosageGuide || '',
      batchNumber: item.batchNumber || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from available fertilizer stock?`)) return;
    try {
      const res = await fetch(`/api/fertilizers?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(`"${name}" removed from catalog.`);
        loadFertilizers();
      } else {
        toast.error(json.message || 'Failed to delete fertilizer item');
      }
    } catch {
      toast.error('Network error while deleting fertilizer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.manufacturer || !form.pricePerUnitInr) {
      toast.warn('Please fill mandatory fields: Fertilizer Name, Manufacturer, and Price.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        category: form.category,
        npkRatio: form.npkRatio.trim(),
        manufacturer: form.manufacturer.trim(),
        bagSizeKg: Number(form.bagSizeKg) || 50,
        unit: form.unit,
        pricePerUnitInr: Number(form.pricePerUnitInr),
        subsidizedPriceInr: form.subsidizedPriceInr ? Number(form.subsidizedPriceInr) : undefined,
        stockAvailableUnits: form.stockAvailableUnits ? Number(form.stockAvailableUnits) : 0,
        suitableCrops: form.suitableCrops
          ? form.suitableCrops
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        applicationMethod: form.applicationMethod,
        dosageGuide: form.dosageGuide.trim(),
        batchNumber: form.batchNumber.trim(),
      };

      const url = '/api/fertilizers';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem._id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(editingItem ? 'Fertilizer entry updated!' : 'New fertilizer entry added successfully!');
        setShowModal(false);
        loadFertilizers();
      } else {
        toast.error(json.message || 'Failed to save fertilizer entry');
      }
    } catch {
      toast.error('Network error while saving fertilizer');
    } finally {
      setSaving(false);
    }
  };

  // Filtered Items
  const filteredFertilizers = useMemo(() => {
    return fertilizers.filter((f) => {
      const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
      const matchSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
        (f.npkRatio && f.npkRatio.toLowerCase().includes(search.toLowerCase())) ||
        (f.suitableCrops && f.suitableCrops.some((c) => c.toLowerCase().includes(search.toLowerCase())));
      return matchCat && matchSearch;
    });
  }, [fertilizers, selectedCategory, search]);

  // Aggregate Metrics
  const totalStockUnits = useMemo(() => {
    return fertilizers.reduce((acc, f) => acc + (Number(f.stockAvailableUnits) || 0), 0);
  }, [fertilizers]);

  const totalInventoryValue = useMemo(() => {
    return fertilizers.reduce(
      (acc, f) => acc + (Number(f.stockAvailableUnits) || 0) * (Number(f.pricePerUnitInr) || 0),
      0
    );
  }, [fertilizers]);

  const lowStockCount = useMemo(() => {
    return fertilizers.filter((f) => (Number(f.stockAvailableUnits) || 0) < 50).length;
  }, [fertilizers]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300">
              <FlaskConical className="w-3.5 h-3.5" /> Fertilizer &amp; Nutrient Inventory
            </span>
            <span className="text-xs text-stone-400">• Certified Agri-Inputs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Available Fertilizer Stock &amp; Catalog
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
            Live database of available primary NPK fertilizers, water-soluble fertigation grades, secondary micronutrients, and bio-organic inputs with real-time stock levels.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/nutrients"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white hover:bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-xs transition"
          >
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            <span>Farm Fertilizer Plans</span>
          </Link>

          <button
            onClick={loadFertilizers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white hover:bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-xs transition"
            title="Refresh Stock Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#245C3A] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Fertilizer Entry</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Available Products</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            {fertilizers.length}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">Standard certified formulations</p>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total Stock in Godown</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            {totalStockUnits.toLocaleString()} <span className="text-sm font-normal text-stone-500">units/bags</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">Ready for dispatch &amp; distribution</p>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total Inventory Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            ₹{totalInventoryValue.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">Estimated value at retail MRP</p>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Low Stock Watchlist</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {lowStockCount} <span className="text-sm font-normal text-stone-500">items</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">&lt; 50 units remaining in stock</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#162218] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by fertilizer name, NPK (e.g. 19-19-19), or brand..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-[#245C3A] text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            All Categories ({fertilizers.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, { label }]) => {
            const count = fertilizers.filter((f) => f.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === catKey
                    ? 'bg-[#245C3A] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'grid' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-400'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'table' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-400'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center">
          <FlaskConical className="w-10 h-10 animate-bounce text-[#245C3A] mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Loading fertilizer stock inventory...</p>
        </div>
      ) : filteredFertilizers.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 p-8">
          <FlaskConical className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No fertilizer entries found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or filter category, or add a new fertilizer entry.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C3A] text-white text-xs font-bold shadow-xs hover:bg-[#193D2A] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Fertilizer Entry</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFertilizers.map((item) => {
            const catBadge = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.primary_npk;
            const isLowStock = item.stockAvailableUnits < 50;

            return (
              <div
                key={item._id}
                className="rounded-3xl border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-[#162218] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catBadge.color}`}>
                      {catBadge.label}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isLowStock
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {item.stockAvailableUnits} {item.unit}s Available
                    </span>
                  </div>

                  {/* Title & Brand */}
                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-snug group-hover:text-[#245C3A] dark:group-hover:text-emerald-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{item.manufacturer}</span>
                    {item.batchNumber && <span className="text-[10px] text-stone-400">• {item.batchNumber}</span>}
                  </p>

                  {/* NPK Ratio & Packaging */}
                  <div className="flex items-center gap-2 mt-3 text-xs">
                    {item.npkRatio && (
                      <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-[11px]">
                        NPK: {item.npkRatio}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] flex items-center gap-1">
                      <Scale className="w-3 h-3 text-stone-400" />
                      {item.bagSizeKg} kg / {item.unit}
                    </span>
                  </div>

                  {/* Dosage & Application */}
                  <div className="mt-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800/60 text-xs">
                    <div className="text-[11px] font-bold text-stone-700 dark:text-stone-300 capitalize mb-1 flex items-center gap-1.5">
                      <Droplet className="w-3 h-3 text-teal-600" />
                      <span>Method: {item.applicationMethod.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                      {item.dosageGuide || 'Standard calibrated agricultural application.'}
                    </p>
                  </div>

                  {/* Suitable Crops */}
                  {item.suitableCrops && item.suitableCrops.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.suitableCrops.slice(0, 4).map((crop, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium"
                        >
                          {crop}
                        </span>
                      ))}
                      {item.suitableCrops.length > 4 && (
                        <span className="text-[10px] text-stone-400 self-center">
                          +{item.suitableCrops.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Price & Actions */}
                <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black text-stone-900 dark:text-white">
                      ₹{item.pricePerUnitInr}
                      <span className="text-xs font-normal text-stone-500"> / {item.unit}</span>
                    </div>
                    {item.subsidizedPriceInr && item.subsidizedPriceInr !== item.pricePerUnitInr && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Subsidized: ₹{item.subsidizedPriceInr}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-white dark:hover:bg-stone-800 transition"
                      title="Edit Fertilizer Entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id, item.name)}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete Fertilizer Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Structured Table View */
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#162218] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Fertilizer Item &amp; Brand</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">NPK Ratio</th>
                  <th className="py-3.5 px-4">Pack Size</th>
                  <th className="py-3.5 px-4">Stock Available</th>
                  <th className="py-3.5 px-4">Unit Price</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredFertilizers.map((item) => {
                  const catBadge = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.primary_npk;
                  return (
                    <tr key={item._id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">{item.manufacturer}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catBadge.color}`}>
                          {catBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-700 dark:text-stone-300">
                        {item.npkRatio || '—'}
                      </td>
                      <td className="py-3 px-4 text-stone-600 dark:text-stone-300">
                        {item.bagSizeKg} kg / {item.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            item.stockAvailableUnits < 50
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {item.stockAvailableUnits} {item.unit}s
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-stone-900 dark:text-white">
                        ₹{item.pricePerUnitInr}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-white dark:hover:bg-stone-800 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id, item.name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Fertilizer Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#162218] p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                    {editingItem ? 'Edit Fertilizer Entry' : 'New Fertilizer Stock Entry'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Record available fertilizer formulation, pricing, and godown stock units.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Row 1: Name and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Fertilizer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Neem Coated Urea, DAP 18:46:0"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Nutrient Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  >
                    <option value="primary_npk">Primary NPK Fertilizer</option>
                    <option value="secondary_micronutrient">Secondary &amp; Micronutrient</option>
                    <option value="water_soluble">100% Water Soluble (Fertigation)</option>
                    <option value="bio_organic">Bio-Fertilizer / Organic Input</option>
                    <option value="soil_amendment">Soil Amendment (Gypsum/Lime)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Manufacturer and NPK Ratio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Manufacturer / Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.manufacturer}
                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                    placeholder="e.g. IFFCO, SPIC, Coromandel, TNAU"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    NPK Ratio / Elemental Analysis
                  </label>
                  <input
                    type="text"
                    value={form.npkRatio}
                    onChange={(e) => setForm({ ...form, npkRatio: e.target.value })}
                    placeholder="e.g. 18-46-0, 19-19-19, 21% Zn"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  />
                </div>
              </div>

              {/* Row 3: Packaging, Unit, and Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Package Size (kg/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.bagSizeKg}
                    onChange={(e) => setForm({ ...form, bagSizeKg: Number(e.target.value) })}
                    placeholder="50"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Packaging Unit
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  >
                    <option value="bag">Bag</option>
                    <option value="kg">Kg Pouch</option>
                    <option value="bottle">Bottle / Can</option>
                    <option value="liter">Liter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Stock Available (Units) *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.stockAvailableUnits}
                    onChange={(e) => setForm({ ...form, stockAvailableUnits: Number(e.target.value) })}
                    placeholder="100"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  />
                </div>
              </div>

              {/* Row 4: Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Price per Unit (INR ₹) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={form.pricePerUnitInr}
                    onChange={(e) => setForm({ ...form, pricePerUnitInr: Number(e.target.value) })}
                    placeholder="1350"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Subsidized / Gov MRP (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.subsidizedPriceInr}
                    onChange={(e) => setForm({ ...form, subsidizedPriceInr: Number(e.target.value) })}
                    placeholder="1350"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  />
                </div>
              </div>

              {/* Row 5: Application Method & Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Application Method
                  </label>
                  <select
                    value={form.applicationMethod}
                    onChange={(e) => setForm({ ...form, applicationMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  >
                    <option value="soil_incorporation">Soil Incorporation (Basal)</option>
                    <option value="broadcasting">Broadcasting (Top Dress)</option>
                    <option value="fertigation">Drip Fertigation</option>
                    <option value="foliar_spray">Foliar Spray</option>
                    <option value="seed_treatment">Seed Treatment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH-2026-SP-01"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                  />
                </div>
              </div>

              {/* Row 6: Suitable Crops */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Suitable Crops (Comma separated)
                </label>
                <input
                  type="text"
                  value={form.suitableCrops}
                  onChange={(e) => setForm({ ...form, suitableCrops: e.target.value })}
                  placeholder="e.g. Paddy (Rice), Maize, Cotton, Groundnut, Sugarcane"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                />
              </div>

              {/* Row 7: Dosage Guide */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Dosage &amp; Agronomy Guidance
                </label>
                <textarea
                  rows={2}
                  value={form.dosageGuide}
                  onChange={(e) => setForm({ ...form, dosageGuide: e.target.value })}
                  placeholder="e.g. 50 kg/acre as basal during final ploughing; split 45 kg at active tillering."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#245C3A]/30 focus:border-[#245C3A]"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Create Fertilizer Entry'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
