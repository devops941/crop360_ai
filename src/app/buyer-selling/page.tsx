'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Handshake,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  X,
  DollarSign,
  Truck,
  Building2,
  Phone,
  ArrowRight,
  FileText,
  Package,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

interface TradeOrder {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string };
  inventoryId?: { _id: string; lotNumber: string; storageLocationName: string };
  commodity: string;
  variety: string;
  buyerName: string;
  buyerType: string;
  buyerContactPhone: string;
  agreedPricePerQuintalInr: number;
  quantityQuintals: number;
  totalSaleAmountInr: number;
  paymentStatus: 'advance_paid' | 'escrow' | 'fully_settled';
  orderStatus: 'negotiating' | 'confirmed' | 'dispatched' | 'settled';
  contractDate: string;
  invoiceNumber: string;
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
}

export default function BuyerSellingPage() {
  const searchParams = useSearchParams();
  const commodityParam = searchParams?.get('commodity') || 'Paddy / Rice';
  const priceParam = searchParams?.get('price') || '2360';

  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmId: '',
    commodity: commodityParam,
    variety: 'Grade A FAQ',
    buyerName: 'Tamil Nadu Agro FPO Federation',
    buyerType: 'fpo',
    buyerContactPhone: '+91 94431 82910',
    agreedPricePerQuintalInr: Number(priceParam),
    quantityQuintals: 75.0,
    totalSaleAmountInr: Number(priceParam) * 75.0,
    paymentStatus: 'advance_paid',
    orderStatus: 'confirmed',
    notes: '20% advance received via NEFT. Balance upon warehouse weighbridge receipt.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, farmRes] = await Promise.all([
        fetch('/api/trade-orders'),
        fetch('/api/farms'),
      ]);

      if (ordRes.ok) {
        const json = await ordRes.json();
        setOrders(json.data || []);
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

  const handlePriceOrQtyChange = (price: number, qty: number) => {
    setFormData((prev) => ({
      ...prev,
      agreedPricePerQuintalInr: price,
      quantityQuintals: qty,
      totalSaleAmountInr: price * qty,
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
      const res = await fetch('/api/trade-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          commodity: formData.commodity,
          variety: formData.variety,
          buyerName: formData.buyerName,
          buyerType: formData.buyerType,
          buyerContactPhone: formData.buyerContactPhone,
          agreedPricePerQuintalInr: Number(formData.agreedPricePerQuintalInr),
          quantityQuintals: Number(formData.quantityQuintals),
          paymentStatus: formData.paymentStatus,
          orderStatus: formData.orderStatus,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create sales contract');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating sales contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, orderStatus: string, paymentStatus?: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/trade-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, orderStatus, paymentStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((item) =>
            item._id === id
              ? {
                  ...item,
                  orderStatus: orderStatus as any,
                  ...(paymentStatus && { paymentStatus: paymentStatus as any }),
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
    return true;
  });

  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalSaleAmountInr || 0), 0);
  const totalVolume = orders.reduce((acc, o) => acc + (o.quantityQuintals || 0), 0);
  const confirmedCount = orders.filter((o) => o.orderStatus === 'confirmed').length;
  const settledCount = orders.filter((o) => o.paymentStatus === 'fully_settled').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Handshake className="h-3.5 w-3.5" /> Direct Farm-to-Trader Sales Marketplace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Buyer Contracts & Produce Sales
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Confirm purchase contracts with institutional buyers, FPOs, and wholesale millers, manage advance payments, and generate digital tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/logistics"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <Truck className="h-4 w-4" />
            Logistics & Dispatch &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Sales Contract
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Gross Sales Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Total contracted revenue</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Volume Sold</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            {totalVolume.toFixed(1)} Qtl
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Commodity volume traded</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Active Contracts</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Handshake className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{confirmedCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Awaiting freight dispatch</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Settled Payments</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#245C3A] dark:text-emerald-400">{settledCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">100% payments credited</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
        <span className="text-xs font-semibold text-stone-600 dark:text-[#a0b5a3] mr-2">Filter Contracts:</span>
        {['all', 'confirmed', 'dispatched', 'settled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-[#245C3A] text-white'
                : 'bg-stone-100 dark:bg-[#193D2A]/60 text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-200 dark:hover:bg-[#193D2A]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Contract Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Fetching buyer sales contracts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Handshake className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Sales Contracts Found</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Create Sales Contract" to record purchase orders from FPOs, millers, and wholesale traders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isSettled = item.paymentStatus === 'fully_settled';
            const isDispatched = item.orderStatus === 'dispatched';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
                      {item.invoiceNumber}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        isSettled
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.paymentStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                    {item.buyerName}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Type: <span className="capitalize font-semibold">{item.buyerType.replace('_', ' ')}</span> &bull; 
                    <Phone className="h-3 w-3" /> {item.buyerContactPhone}
                  </p>

                  <div className="mt-4 p-3.5 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs text-stone-500 dark:text-[#a0b5a3]">Total Deal Value:</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{item.totalSaleAmountInr.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs py-1 border-t border-stone-200/50 dark:border-[#245C3A]/20">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Volume & Rate:</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {item.quantityQuintals} Qtl @ ₹{item.agreedPricePerQuintalInr} / Qtl
                      </span>
                    </div>

                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Commodity:</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {item.commodity} ({item.variety})
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-[11px] text-stone-600 dark:text-[#a0b5a3] italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {!isSettled ? (
                      <button
                        onClick={() => handleUpdateStatus(item._id, 'settled', 'fully_settled')}
                        disabled={updatingId === item._id}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                      >
                        Settle Payment
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Fully Paid
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/logistics?orderId=${item._id}&buyer=${encodeURIComponent(item.buyerName)}&qty=${item.quantityQuintals}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#245C3A] dark:text-emerald-400 hover:underline"
                  >
                    Dispatch Freight <ArrowRight className="h-3.5 w-3.5" />
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
                  <Handshake className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">New Buyer Sales Agreement</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    FPO / wholesale purchase order & invoice generation
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
                    Buyer Name / Company *
                  </label>
                  <input
                    type="text"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Buyer Category
                  </label>
                  <select
                    value={formData.buyerType}
                    onChange={(e) => setFormData({ ...formData, buyerType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="fpo">Farmer Producer Organization (FPO)</option>
                    <option value="wholesaler">Grain Wholesaler / Miller</option>
                    <option value="food_processor">Food Processing Company</option>
                    <option value="retail_chain">Retail Supermarket Chain</option>
                    <option value="mandi_trader">Mandi Commission Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Buyer Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.buyerContactPhone}
                    onChange={(e) => setFormData({ ...formData, buyerContactPhone: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Commodity
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
                    Agreed Price (₹ / Quintal) *
                  </label>
                  <input
                    type="number"
                    value={formData.agreedPricePerQuintalInr}
                    onChange={(e) =>
                      handlePriceOrQtyChange(Number(e.target.value), formData.quantityQuintals)
                    }
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Contract Quantity (Quintals) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.quantityQuintals}
                    onChange={(e) =>
                      handlePriceOrQtyChange(formData.agreedPricePerQuintalInr, Number(e.target.value))
                    }
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20 flex items-center justify-between text-xs">
                <span className="text-stone-600 dark:text-[#a0b5a3] font-semibold">Total Contract Value:</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{formData.totalSaleAmountInr.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Payment Terms & Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Advance amount, bank transfer terms, delivery timelines..."
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
                  Generate Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
