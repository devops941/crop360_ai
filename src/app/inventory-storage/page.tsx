'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Warehouse,
  Boxes,
  Package,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  X,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Sparkles,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface InventoryItem {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string };
  commodity: string;
  variety: string;
  storageType: string;
  lotNumber: string;
  storageLocationName: string;
  bagsStored: number;
  bagWeightKg: number;
  totalQuantityQuintals: number;
  fumigationLastDate?: string;
  nextFumigationDueDate?: string;
  warehouseReceiptNumber?: string;
  status: 'in_storage' | 'partially_sold' | 'dispatched';
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
}

export default function InventoryStoragePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmId: '',
    commodity: 'Paddy / Rice',
    variety: 'CO 51',
    storageType: 'cwc_warehouse',
    lotNumber: '',
    storageLocationName: 'Central Warehousing Corp (CWC) Godown 4, Thanjavur',
    bagsStored: 150,
    bagWeightKg: 50,
    totalQuantityQuintals: 75.0,
    warehouseReceiptNumber: '',
    status: 'in_storage',
    notes: 'Grain conditioned to 12.8% moisture. Vacuum fumigated with aluminium phosphide.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, farmRes] = await Promise.all([
        fetch('/api/inventory-storage'),
        fetch('/api/farms'),
      ]);

      if (invRes.ok) {
        const json = await invRes.json();
        setItems(json.data || []);
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

  const handleBagsChange = (bags: number) => {
    const totalQtl = (bags * formData.bagWeightKg) / 100;
    setFormData((prev) => ({
      ...prev,
      bagsStored: bags,
      totalQuantityQuintals: totalQtl,
    }));
  };

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
      const res = await fetch('/api/inventory-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          commodity: formData.commodity,
          variety: formData.variety,
          storageType: formData.storageType,
          lotNumber: formData.lotNumber || undefined,
          storageLocationName: formData.storageLocationName,
          bagsStored: Number(formData.bagsStored),
          bagWeightKg: Number(formData.bagWeightKg),
          totalQuantityQuintals: Number(formData.totalQuantityQuintals),
          warehouseReceiptNumber: formData.warehouseReceiptNumber || undefined,
          status: formData.status,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to record stock inward');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/inventory-storage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
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

  const filtered = items.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  const totalQuintals = items.reduce((acc, i) => acc + (i.totalQuantityQuintals || 0), 0);
  const totalBags = items.reduce((acc, i) => acc + (i.bagsStored || 0), 0);
  const receiptCount = items.filter((i) => i.warehouseReceiptNumber).length;
  const inStorageCount = items.filter((i) => i.status === 'in_storage').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Warehouse className="h-3.5 w-3.5" /> Silo Stock Control & eNWR Warehouse Receipts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Storage & Inventory Management
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Track on-farm godowns, Central Warehousing Corporation (CWC) silos, batch lot numbers, electronic Negotiable Warehouse Receipts (eNWR), and fumigation schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/market-prices"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Mandi Prices &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Log Stock Inward
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Stored Volume</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            {totalQuintals.toFixed(1)} Qtl
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Physical inventory on hand</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Gunny Sacks Stored</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalBags} Bags
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Standard 50kg lot units</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">eNWR Pledges</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {receiptCount} Receipts
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Warehouse loan eligible</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Active Godowns</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Warehouse className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{inStorageCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Fumigated storage lots</p>
        </div>
      </div>

      {/* Filter and Status Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-600 dark:text-[#a0b5a3] mr-2">Filter By:</span>
          {['all', 'in_storage', 'partially_sold', 'dispatched'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#245C3A] text-white'
                  : 'bg-stone-100 dark:bg-[#193D2A]/60 text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-200 dark:hover:bg-[#193D2A]'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Scanning warehouse stock ledgers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Warehouse className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Stored Inventory Found</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Log Stock Inward" to register grain batches into farm godowns or CWC silos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isInStorage = item.status === 'in_storage';
            const isPartiallySold = item.status === 'partially_sold';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
                      Lot: {item.lotNumber}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        isInStorage
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : isPartiallySold
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                          : 'bg-stone-100 dark:bg-[#193D2A] text-stone-600 dark:text-[#CFDEC9]'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                    {item.commodity} &bull; {item.variety}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5">
                    Location: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.storageLocationName}</span>
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Stored Stock</span>
                      <span className="font-bold text-stone-900 dark:text-white text-sm">
                        {item.totalQuantityQuintals} Qtl
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Bag Count</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {item.bagsStored} Bags
                      </span>
                    </div>
                  </div>

                  {item.warehouseReceiptNumber && (
                    <div className="mt-3 p-2 rounded-lg bg-emerald-50/60 dark:bg-[#121c14] border border-emerald-200 dark:border-[#245C3A]/30 flex items-center justify-between text-[11px]">
                      <span className="text-stone-600 dark:text-[#a0b5a3] flex items-center gap-1 font-semibold">
                        <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> eNWR Receipt:
                      </span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {item.warehouseReceiptNumber}
                      </span>
                    </div>
                  )}

                  {item.nextFumigationDueDate && (
                    <div className="mt-2 text-[10px] text-stone-500 dark:text-[#a0b5a3] flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-amber-500" /> Next Fumigation: {new Date(item.nextFumigationDueDate).toLocaleDateString()}
                    </div>
                  )}

                  {item.notes && (
                    <p className="mt-2 text-[11px] text-stone-600 dark:text-[#a0b5a3] italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {isInStorage ? (
                      <button
                        onClick={() => handleUpdateStatus(item._id, 'partially_sold')}
                        disabled={updatingId === item._id}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 transition-colors"
                      >
                        Mark Partially Sold
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(item._id, 'in_storage')}
                        disabled={updatingId === item._id}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-[#193D2A] text-stone-700 dark:text-[#CFDEC9] transition-colors"
                      >
                        Reset In Storage
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/market-prices?commodity=${encodeURIComponent(item.commodity)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline"
                  >
                    Mandi Rates <ArrowRight className="h-3 w-3" />
                  </Link>
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
                  <Warehouse className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Log Storage Inward Record</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Warehouse lot registration & eNWR pledge
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
                  Origin Farm Parcel *
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
                    Commodity *
                  </label>
                  <input
                    type="text"
                    value={formData.commodity}
                    onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Variety *
                  </label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Storage Facility Type
                  </label>
                  <select
                    value={formData.storageType}
                    onChange={(e) => setFormData({ ...formData, storageType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="cwc_warehouse">CWC Central Warehouse</option>
                    <option value="farm_godown">On-Farm Traditional Godown</option>
                    <option value="pacs_storage">Primary Agr. Co-op (PACS)</option>
                    <option value="metal_silo">Airtight Metal Grain Silo</option>
                    <option value="cold_storage">Cold Storage (Perishables)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Storage Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.storageLocationName}
                    onChange={(e) => setFormData({ ...formData, storageLocationName: e.target.value })}
                    required
                    placeholder="e.g. CWC Godown 4, Thanjavur"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Bags Stored (50kg sacks) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.bagsStored}
                    onChange={(e) => handleBagsChange(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Total Quantity (Quintals) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.totalQuantityQuintals}
                    onChange={(e) => setFormData({ ...formData, totalQuantityQuintals: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Storage & Fumigation Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Fumigation gas used, stack number..."
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
                  Save Inward Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
