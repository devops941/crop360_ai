'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coins,
  TrendingUp,
  DollarSign,
  PieChart,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  X,
  FileText,
  ArrowRight,
  Bot,
  Layers,
  Sparkles,
  Calculator,
} from 'lucide-react';

interface CostBreakdown {
  seedCost: number;
  landPrepCost: number;
  fertilizerNutrientCost: number;
  cropProtectionCost: number;
  irrigationCost: number;
  laborCost: number;
  harvestingCost: number;
  logisticsCost: number;
}

interface CropPnlRecord {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string };
  cropName: string;
  varietyName: string;
  season: string;
  areaAcres: number;
  costBreakdown: CostBreakdown;
  totalCostOfCultivationInr: number;
  grossMandiRevenueInr: number;
  netProfitInr: number;
  netRoiPercent: number;
  costPerQuintalInr: number;
  totalYieldQuintals: number;
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
}

export default function CultivationPnlPage() {
  const [ledgers, setLedgers] = useState<CropPnlRecord[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    farmId: '',
    cropName: 'Paddy / Rice',
    varietyName: 'CO 51',
    season: 'Samba / Kharif',
    areaAcres: 3.0,
    totalYieldQuintals: 78.5,
    grossMandiRevenueInr: 185260,
    costBreakdown: {
      seedCost: 2400,
      landPrepCost: 7500,
      fertilizerNutrientCost: 14200,
      cropProtectionCost: 5600,
      irrigationCost: 3800,
      laborCost: 19500,
      harvestingCost: 7800,
      logisticsCost: 4200,
    },
    notes: 'High net return enabled by precision fertigation and direct FPO mandi procurement contract.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pnlRes, farmRes] = await Promise.all([
        fetch('/api/cultivation-pnl'),
        fetch('/api/farms'),
      ]);

      if (pnlRes.ok) {
        const json = await pnlRes.json();
        setLedgers(json.data || []);
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

  const handleCostChange = (key: keyof CostBreakdown, value: number) => {
    setFormData((prev) => ({
      ...prev,
      costBreakdown: {
        ...prev.costBreakdown,
        [key]: value,
      },
    }));
  };

  const currentTotalCost = Object.values(formData.costBreakdown).reduce((acc, c) => acc + Number(c || 0), 0);
  const currentNetProfit = formData.grossMandiRevenueInr - currentTotalCost;
  const currentRoi = currentTotalCost > 0 ? Math.round((currentNetProfit / currentTotalCost) * 1000) / 10 : 0;

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
      const res = await fetch('/api/cultivation-pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          cropName: formData.cropName,
          varietyName: formData.varietyName,
          season: formData.season,
          areaAcres: Number(formData.areaAcres),
          totalYieldQuintals: Number(formData.totalYieldQuintals),
          grossMandiRevenueInr: Number(formData.grossMandiRevenueInr),
          costBreakdown: formData.costBreakdown,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save P&L ledger');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording P&L statement');
    } finally {
      setSubmitting(false);
    }
  };

  const totalGrossRevenue = ledgers.reduce((acc, l) => acc + (l.grossMandiRevenueInr || 0), 0);
  const totalCost = ledgers.reduce((acc, l) => acc + (l.totalCostOfCultivationInr || 0), 0);
  const totalNetProfit = ledgers.reduce((acc, l) => acc + (l.netProfitInr || 0), 0);
  const avgRoi = totalCost > 0 ? Math.round((totalNetProfit / totalCost) * 1000) / 10 : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Coins className="h-3.5 w-3.5" /> Full Cost of Cultivation & Net ROI Accounting
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Cultivation Cost & Profit (P&L) Ledger
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Audit itemized crop expenditures (seed, fertilizer, machinery, labor, freight) against gross mandi revenue to evaluate exact net margins per acre.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/ai-assistant"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <Bot className="h-4 w-4" />
            AI Agronomist &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Record Crop P&L Statement
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Gross Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            ₹{totalGrossRevenue.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Total mandi crop realizations</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Cost of Cultivation</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            ₹{totalCost.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Total input & labor costs</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Net Farm Profit</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#245C3A] dark:text-emerald-400">
            ₹{totalNetProfit.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Pure net farmer margin</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Average ROI</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {avgRoi}% ROI
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Return on production investment</p>
        </div>
      </div>

      {/* P&L Ledgers Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Calculating cultivation ledgers & cost splits...</p>
        </div>
      ) : ledgers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Coins className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No P&L Ledgers Recorded</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Record Crop P&L Statement" to itemize input expenditures and evaluate net farm profits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ledgers.map((item) => {
            const isProfit = item.netProfitInr >= 0;

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
                      {item.season} &bull; {item.areaAcres} Acres
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        isProfit
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {isProfit ? `+${item.netRoiPercent}% ROI` : `${item.netRoiPercent}% Loss`}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 dark:text-white leading-tight">
                    {item.cropName} ({item.varietyName})
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5">
                    Parcel: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.farmId?.parcelName}</span> &bull; 
                    Grower: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.farmerId?.name}</span>
                  </p>

                  {/* Profit Banner */}
                  <div className="mt-4 p-4 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Net Realized Profit:</span>
                      <span className={`text-xl font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                        ₹{item.netProfitInr.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/50 dark:border-[#245C3A]/20 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Gross Revenue</span>
                        <span className="font-bold text-stone-900 dark:text-white">₹{item.grossMandiRevenueInr.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Total Cultivation Cost</span>
                        <span className="font-bold text-red-600 dark:text-red-400">₹{item.totalCostOfCultivationInr.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Cost / Quintal</span>
                        <span className="font-bold text-stone-900 dark:text-white">₹{item.costPerQuintalInr} / Qtl</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Total Yield</span>
                        <span className="font-bold text-stone-900 dark:text-white">{item.totalYieldQuintals} Qtl</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown Items */}
                  <div className="mt-4 space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-stone-600 dark:text-[#a0b5a3] block mb-1">
                      Itemized Cost Breakdown:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#121c14]/40 border border-stone-100 dark:border-[#245C3A]/20">
                        <span className="text-stone-400 block text-[10px]">Seeds</span>
                        <span className="font-semibold text-stone-800 dark:text-white">₹{item.costBreakdown.seedCost}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#121c14]/40 border border-stone-100 dark:border-[#245C3A]/20">
                        <span className="text-stone-400 block text-[10px]">Fertilizer</span>
                        <span className="font-semibold text-stone-800 dark:text-white">₹{item.costBreakdown.fertilizerNutrientCost}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#121c14]/40 border border-stone-100 dark:border-[#245C3A]/20">
                        <span className="text-stone-400 block text-[10px]">Labor Wages</span>
                        <span className="font-semibold text-stone-800 dark:text-white">₹{item.costBreakdown.laborCost}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#121c14]/40 border border-stone-100 dark:border-[#245C3A]/20">
                        <span className="text-stone-400 block text-[10px]">Machinery/Harv</span>
                        <span className="font-semibold text-stone-800 dark:text-white">₹{item.costBreakdown.harvestingCost}</span>
                      </div>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-[11px] text-stone-600 dark:text-[#a0b5a3] italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30 flex items-center justify-between text-xs">
                  <span className="text-stone-400 text-[11px]">
                    Profit per Acre: <span className="font-bold text-stone-800 dark:text-white">₹{Math.round(item.netProfitInr / item.areaAcres).toLocaleString()}</span>
                  </span>

                  <Link
                    href="/ai-assistant"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline"
                  >
                    Ask AI for Margin Optimization <ArrowRight className="h-3 w-3" />
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
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#245C3A]/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Record Cultivation P&L Ledger</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Itemize production costs & revenue realization
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
                  Target Farm Parcel *
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    value={formData.cropName}
                    onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Variety Name *
                  </label>
                  <input
                    type="text"
                    value={formData.varietyName}
                    onChange={(e) => setFormData({ ...formData, varietyName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Season
                  </label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="Samba / Kharif">Samba / Kharif</option>
                    <option value="Thaladi / Rabi">Thaladi / Rabi</option>
                    <option value="Navarai / Summer">Navarai / Summer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Cultivated Area (Acres) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.areaAcres}
                    onChange={(e) => setFormData({ ...formData, areaAcres: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Total Yield (Quintals) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.totalYieldQuintals}
                    onChange={(e) => setFormData({ ...formData, totalYieldQuintals: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Gross Revenue (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.grossMandiRevenueInr}
                    onChange={(e) => setFormData({ ...formData, grossMandiRevenueInr: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Itemized Cost Inputs */}
              <div>
                <span className="block text-xs font-bold mb-2 text-stone-900 dark:text-white">
                  Itemized Production Costs (₹):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-[#a0b5a3] mb-0.5">Seeds</label>
                    <input
                      type="number"
                      value={formData.costBreakdown.seedCost}
                      onChange={(e) => handleCostChange('seedCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-[#a0b5a3] mb-0.5">Land Prep / Tillage</label>
                    <input
                      type="number"
                      value={formData.costBreakdown.landPrepCost}
                      onChange={(e) => handleCostChange('landPrepCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-[#a0b5a3] mb-0.5">Fertilizers & FYM</label>
                    <input
                      type="number"
                      value={formData.costBreakdown.fertilizerNutrientCost}
                      onChange={(e) => handleCostChange('fertilizerNutrientCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-[#a0b5a3] mb-0.5">Crop Protection</label>
                    <input
                      type="number"
                      value={formData.costBreakdown.cropProtectionCost}
                      onChange={(e) => handleCostChange('cropProtectionCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-[#a0b5a3] mb-0.5">Irrigation / Electricity</label>
                    <input
                      type="number"
                      value={formData.costBreakdown.irrigationCost}
                      onChange={(e) => handleCostChange('irrigationCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-[#a0b5a3] mb-0.5">Labor & Weeding</label>
                    <input
                      type="number"
                      value={formData.costBreakdown.laborCost}
                      onChange={(e) => handleCostChange('laborCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-[#a0b5a3] mb-0.5">Harvest Machinery</label>
                    <input
                      type="number"
                      value={formData.costBreakdown.harvestingCost}
                      onChange={(e) => handleCostChange('harvestingCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 dark:text-[#a0b5a3] mb-0.5">Mandi Freight</label>
                    <input
                      type="number"
                      value={formData.costBreakdown.logisticsCost}
                      onChange={(e) => handleCostChange('logisticsCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Live P&L Preview */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Total Cost</span>
                  <span className="font-bold text-red-600 dark:text-red-400">₹{currentTotalCost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Net Realized Profit</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{currentNetProfit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Projected ROI</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{currentRoi}%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Agronomic Notes & Cost Drivers
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key savings, market price notes, subsidy claims..."
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
                  Save P&L Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
