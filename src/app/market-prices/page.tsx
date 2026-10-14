'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  DollarSign,
  Plus,
  Loader2,
  X,
  MapPin,
  Building2,
  ArrowRight,
  Handshake,
  Calendar,
  Sparkles,
  Wheat,
} from 'lucide-react';

interface MarketPrice {
  _id: string;
  commodity: string;
  variety: string;
  mandiName: string;
  district: string;
  state: string;
  minPriceInrPerQuintal: number;
  modalPriceInrPerQuintal: number;
  maxPriceInrPerQuintal: number;
  governmentMspInrPerQuintal: number;
  priceTrend: 'upward' | 'stable' | 'downward';
  recordedDate: string;
}

const COMMODITIES = ['All', 'Paddy / Rice', 'Maize / Corn', 'Groundnut / Peanut', 'Cotton', 'Black Gram / Urad Dal'];

export default function MarketPricesPage() {
  const searchParams = useSearchParams();
  const commodityParam = searchParams?.get('commodity') || 'All';

  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommodity, setSelectedCommodity] = useState(commodityParam);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    commodity: 'Paddy / Rice',
    variety: 'Common / Grade A',
    mandiName: 'Thanjavur APMC Regulated Market',
    district: 'Thanjavur',
    state: 'Tamil Nadu',
    minPriceInrPerQuintal: 2280,
    modalPriceInrPerQuintal: 2380,
    maxPriceInrPerQuintal: 2480,
    governmentMspInrPerQuintal: 2320,
    priceTrend: 'upward',
  });

  const loadPrices = async (comm: string) => {
    try {
      setLoading(true);
      const url = comm !== 'All' ? `/api/market-prices?commodity=${encodeURIComponent(comm)}` : '/api/market-prices';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPrices(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices(selectedCommodity);
  }, [selectedCommodity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/market-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        loadPrices(selectedCommodity);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save market price');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording market price');
    } finally {
      setSubmitting(false);
    }
  };

  const highestPrice = prices.reduce((max, p) => (p.modalPriceInrPerQuintal > max ? p.modalPriceInrPerQuintal : max), 0);
  const avgPrice = prices.length
    ? Math.round(prices.reduce((acc, p) => acc + p.modalPriceInrPerQuintal, 0) / prices.length)
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
              Module 22 &bull; Phase 8
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <BarChart3 className="h-3.5 w-3.5" /> Agmarknet & eNAM Spot Rates
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Market Price & MSP Analysis
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Live APMC mandi bids across Tamil Nadu, comparing real-time spot auction rates against Government Minimum Support Price (MSP) benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/buyer-selling"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <Handshake className="h-4 w-4" />
            Module 23: Sell Produce &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Record Spot Rate
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Mandis Tracked</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{prices.length} Markets</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Daily auction prices</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Highest Spot Bid</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{highestPrice.toLocaleString()} / Qtl
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Peak regulated market rate</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Avg Modal Rate</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
            ₹{avgPrice.toLocaleString()} / Qtl
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Weighted mandi average</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">MSP Protection</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#245C3A] dark:text-emerald-400">100% Guaranteed</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Govt minimum benchmark</p>
        </div>
      </div>

      {/* Commodity Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
        {COMMODITIES.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCommodity(c)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCommodity === c
                ? 'bg-[#245C3A] text-white shadow-xs'
                : 'text-stone-700 dark:text-[#CFDEC9] hover:bg-stone-100 dark:hover:bg-[#193D2A]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Price Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Connecting to Agmarknet market feeds...</p>
        </div>
      ) : prices.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <BarChart3 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Price Records Found</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Record Spot Rate" to register the latest mandi auction bid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prices.map((item) => {
            const isAboveMsp = item.modalPriceInrPerQuintal >= item.governmentMspInrPerQuintal;
            const diffMsp = item.modalPriceInrPerQuintal - item.governmentMspInrPerQuintal;

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
                      {item.district} &bull; {item.state}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        item.priceTrend === 'upward'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.priceTrend === 'downward'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-stone-500 dark:text-[#a0b5a3]'
                      }`}
                    >
                      {item.priceTrend === 'upward' && <TrendingUp className="h-3.5 w-3.5" />}
                      {item.priceTrend === 'downward' && <TrendingDown className="h-3.5 w-3.5" />}
                      {item.priceTrend === 'stable' && <Minus className="h-3.5 w-3.5" />}
                      {item.priceTrend.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                    {item.commodity}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5">
                    Variety: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.variety}</span> &bull; 
                    {item.mandiName}
                  </p>

                  <div className="mt-4 p-4 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Modal Auction Price:</span>
                      <span className="text-xl font-bold text-stone-900 dark:text-white">
                        ₹{item.modalPriceInrPerQuintal.toLocaleString()}
                        <span className="text-xs font-normal text-stone-400"> / Qtl</span>
                      </span>
                    </div>

                    <div className="flex justify-between text-xs py-1 border-t border-stone-200/50 dark:border-[#245C3A]/20">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Range (Min &ndash; Max):</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        ₹{item.minPriceInrPerQuintal} &ndash; ₹{item.maxPriceInrPerQuintal}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Govt MSP Benchmark:</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        ₹{item.governmentMspInrPerQuintal}
                      </span>
                    </div>
                  </div>

                  {/* MSP Comparison Status */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-[#a0b5a3]">MSP Spread:</span>
                    {isAboveMsp ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +₹{diffMsp} / Qtl above MSP (Favorable)
                      </span>
                    ) : (
                      <span className="font-bold text-red-600 dark:text-red-400">
                        -₹{Math.abs(diffMsp)} / Qtl below MSP
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30">
                  <Link
                    href={`/buyer-selling?commodity=${encodeURIComponent(item.commodity)}&price=${item.modalPriceInrPerQuintal}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors"
                  >
                    Sell Produce at this Rate <ArrowRight className="h-3.5 w-3.5" />
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
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Record Mandi Spot Price</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    APMC regulated auction rates & MSP benchmark
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
                    Variety / Grade *
                  </label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Mandi / APMC Yard Name *
                  </label>
                  <input
                    type="text"
                    value={formData.mandiName}
                    onChange={(e) => setFormData({ ...formData, mandiName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    District *
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Modal Price (₹ / Qtl) *
                  </label>
                  <input
                    type="number"
                    value={formData.modalPriceInrPerQuintal}
                    onChange={(e) => setFormData({ ...formData, modalPriceInrPerQuintal: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Min Price (₹ / Qtl)
                  </label>
                  <input
                    type="number"
                    value={formData.minPriceInrPerQuintal}
                    onChange={(e) => setFormData({ ...formData, minPriceInrPerQuintal: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Max Price (₹ / Qtl)
                  </label>
                  <input
                    type="number"
                    value={formData.maxPriceInrPerQuintal}
                    onChange={(e) => setFormData({ ...formData, maxPriceInrPerQuintal: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Government MSP (₹ / Qtl)
                  </label>
                  <input
                    type="number"
                    value={formData.governmentMspInrPerQuintal}
                    onChange={(e) => setFormData({ ...formData, governmentMspInrPerQuintal: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Price Trend
                  </label>
                  <select
                    value={formData.priceTrend}
                    onChange={(e) => setFormData({ ...formData, priceTrend: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="upward">Upward (Bullish demand)</option>
                    <option value="stable">Stable (Moderate demand)</option>
                    <option value="downward">Downward (Surplus supply)</option>
                  </select>
                </div>
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
                  Save Spot Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
