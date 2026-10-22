'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  X,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Package,
  Navigation,
  FileText,
  Coins,
} from 'lucide-react';

interface LogisticsTrip {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string };
  orderId?: { _id: string; buyerName: string; commodity: string; quantityQuintals: number };
  vehicleType: string;
  vehicleRegistrationNo: string;
  driverName: string;
  driverPhone: string;
  pickupLocation: string;
  destinationMandi: string;
  distanceKm: number;
  freightChargeInr: number;
  dispatchTimestamp: string;
  deliveryStatus: 'scheduled' | 'in_transit' | 'unloaded_at_mandi';
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
}

export default function LogisticsPage() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams?.get('orderId') || '';
  const buyerParam = searchParams?.get('buyer') || '';

  const [trips, setTrips] = useState<LogisticsTrip[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmId: '',
    vehicleType: 'mini_truck_ace',
    vehicleRegistrationNo: 'TN-49-AB-4812',
    driverName: 'K. Murugan',
    driverPhone: '+91 98421 73820',
    pickupLocation: 'Farm Parcel 3, Orathanadu',
    destinationMandi: 'Thanjavur APMC Regulated Yard',
    distanceKm: 28,
    freightChargeInr: 1400,
    deliveryStatus: 'scheduled',
    notes: 'Produce loaded in 150 gunny sacks. Tarpaulin cover fastened.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripRes, farmRes] = await Promise.all([
        fetch('/api/logistics'),
        fetch('/api/farms'),
      ]);

      if (tripRes.ok) {
        const json = await tripRes.json();
        setTrips(json.data || []);
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

  const handleDistanceChange = (km: number) => {
    const ratePerKm = formData.vehicleType === 'tractor_trailer' ? 40 : 50;
    const estFreight = Math.max(800, km * ratePerKm);
    setFormData((prev) => ({
      ...prev,
      distanceKm: km,
      freightChargeInr: estFreight,
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
      const res = await fetch('/api/logistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          orderId: orderIdParam || undefined,
          vehicleType: formData.vehicleType,
          vehicleRegistrationNo: formData.vehicleRegistrationNo,
          driverName: formData.driverName,
          driverPhone: formData.driverPhone,
          pickupLocation: formData.pickupLocation,
          destinationMandi: formData.destinationMandi,
          distanceKm: Number(formData.distanceKm),
          freightChargeInr: Number(formData.freightChargeInr),
          deliveryStatus: formData.deliveryStatus,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to dispatch vehicle');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating dispatch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, deliveryStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/logistics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deliveryStatus }),
      });
      if (res.ok) {
        setTrips((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, deliveryStatus: deliveryStatus as any } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = trips.filter((t) => {
    if (statusFilter !== 'all' && t.deliveryStatus !== statusFilter) return false;
    return true;
  });

  const totalFreightCost = trips.reduce((acc, t) => acc + (t.freightChargeInr || 0), 0);
  const inTransitCount = trips.filter((t) => t.deliveryStatus === 'in_transit').length;
  const deliveredCount = trips.filter((t) => t.deliveryStatus === 'unloaded_at_mandi').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Truck className="h-3.5 w-3.5" /> Mandi Freight Dispatch & Live Route Tracker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Transportation & Logistics
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Book local transport (Tata Ace, tractor-trailers, 10-wheelers), calculate distance-based freight charges, and track real-time delivery to APMC mandi yards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/cultivation-pnl"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <Coins className="h-4 w-4" />
            P&L Profit Ledger &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Book Freight Dispatch
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Total Dispatches</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{trips.length} Trips</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Mandi freight routes</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">In Transit</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Navigation className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{inTransitCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">En route to destination</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Mandi Unloaded</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{deliveredCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Delivered & received</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Total Freight Paid</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₹{totalFreightCost.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Total logistics overhead</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
        <span className="text-xs font-semibold text-stone-600 dark:text-[#a0b5a3] mr-2">Filter Status:</span>
        {['all', 'scheduled', 'in_transit', 'unloaded_at_mandi'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-[#245C3A] text-white'
                : 'bg-stone-100 dark:bg-[#193D2A]/60 text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-200 dark:hover:bg-[#193D2A]'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Dispatch Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Fetching logistics fleet dispatches...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Truck className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Freight Dispatches</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Book Freight Dispatch" to assign vehicles and calculate transport freight to mandi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isDelivered = item.deliveryStatus === 'unloaded_at_mandi';
            const isInTransit = item.deliveryStatus === 'in_transit';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
                      {item.vehicleRegistrationNo}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        isDelivered
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : isInTransit
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          : 'bg-stone-100 dark:bg-[#193D2A] text-stone-600 dark:text-[#CFDEC9]'
                      }`}
                    >
                      {item.deliveryStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight capitalize">
                    {item.vehicleType.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5 flex items-center gap-1">
                    Driver: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.driverName}</span> &bull; 
                    <Phone className="h-3 w-3" /> {item.driverPhone}
                  </p>

                  <div className="mt-4 p-3.5 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-stone-400 block">Origin:</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">{item.pickupLocation}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 border-t border-stone-200/50 dark:border-[#245C3A]/20">
                      <Navigation className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-stone-400 block">Destination:</span>
                        <span className="font-semibold text-stone-900 dark:text-white">{item.destinationMandi}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 dark:border-[#245C3A]/20">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Distance: {item.distanceKm} km</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{item.freightChargeInr.toLocaleString()}
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
                    {!isDelivered ? (
                      <>
                        {item.deliveryStatus === 'scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(item._id, 'in_transit')}
                            disabled={updatingId === item._id}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors"
                          >
                            Dispatch Vehicle
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'unloaded_at_mandi')}
                          disabled={updatingId === item._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors"
                        >
                          Mark Unloaded
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Delivered at APMC
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-stone-400">
                    {new Date(item.dispatchTimestamp).toLocaleDateString()}
                  </span>
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
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Book Farm Logistics Dispatch</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Vehicle allocation & freight rate computation
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
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="mini_truck_ace">Tata Ace (1.5 - 2.5 Tonnes)</option>
                    <option value="tractor_trailer">Tractor Trolley / Trailer</option>
                    <option value="pickup_truck">Mahindra Bolero Pickup</option>
                    <option value="lorry_10_wheel">10-Wheel Commercial Lorry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Vehicle Registration No *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleRegistrationNo}
                    onChange={(e) => setFormData({ ...formData, vehicleRegistrationNo: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Driver Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Pickup Location *
                  </label>
                  <input
                    type="text"
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Destination Mandi *
                  </label>
                  <input
                    type="text"
                    value={formData.destinationMandi}
                    onChange={(e) => setFormData({ ...formData, destinationMandi: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Distance (Kilometers) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.distanceKm}
                    onChange={(e) => handleDistanceChange(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Freight Charge (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.freightChargeInr}
                    onChange={(e) => setFormData({ ...formData, freightChargeInr: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Loading Notes & Toll Charges
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Number of bags loaded, driver instructions..."
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
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
