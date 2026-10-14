'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, Save, Map, Layers, Droplet } from 'lucide-react';
import { farmSchema, FarmInput } from '@/validators/farm.validator';
import Link from 'next/link';

interface FarmFormProps {
  mode: 'create' | 'edit';
  farmId?: string;
  initialData?: Partial<FarmInput>;
}

export function FarmForm({ mode, farmId, initialData }: FarmFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState<
    { _id: string; name: string; farmerCode: string; district: string }[]
  >([]);

  useEffect(() => {
    async function loadFarmers() {
      try {
        const res = await fetch('/api/farmers');
        if (res.ok) {
          const json = await res.json();
          setFarmers(json.data || []);
        }
      } catch {
        console.error('Failed to load farmers');
      }
    }
    loadFarmers();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FarmInput>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      farmerId: initialData?.farmerId || '',
      surveyNumber: initialData?.surveyNumber || '',
      parcelName: initialData?.parcelName || 'Main Field',
      totalAreaAcres: initialData?.totalAreaAcres || 2.5,
      cultivableAreaAcres: initialData?.cultivableAreaAcres || 2.5,
      soilType: initialData?.soilType || 'alluvial',
      irrigationSource: initialData?.irrigationSource || 'borewell',
      waterAvailabilityMonths: initialData?.waterAvailabilityMonths || 8,
      village: initialData?.village || '',
      district: initialData?.district || 'Thanjavur',
      state: initialData?.state || 'Tamil Nadu',
      status: initialData?.status || 'active',
    },
  });

  // Sync initialData into form fields when fetched in edit mode
  useEffect(() => {
    if (initialData) {
      reset({
        farmerId: initialData.farmerId || '',
        surveyNumber: initialData.surveyNumber || '',
        parcelName: initialData.parcelName || 'Main Field',
        totalAreaAcres: initialData.totalAreaAcres || 2.5,
        cultivableAreaAcres: initialData.cultivableAreaAcres || 2.5,
        soilType: initialData.soilType || 'alluvial',
        irrigationSource: initialData.irrigationSource || 'borewell',
        waterAvailabilityMonths: initialData.waterAvailabilityMonths || 8,
        village: initialData.village || '',
        district: initialData.district || 'Thanjavur',
        state: initialData.state || 'Tamil Nadu',
        status: initialData.status || 'active',
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (values: FarmInput) => {
    setLoading(true);
    try {
      const url = mode === 'create' ? '/api/farms' : `/api/farms/${farmId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorDetails = data.error?.details
          ? Object.values(data.error.details).join(', ')
          : data.message;
        throw new Error(errorDetails || 'Failed to save farm parcel');
      }

      toast.success(
        mode === 'create'
          ? `Land parcel "${values.parcelName}" registered successfully!`
          : `Land parcel details updated successfully!`
      );

      router.push('/farms');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/farms"
            className="p-2 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#252B26] dark:text-stone-100">
              {mode === 'create' ? 'Register New Land Parcel' : 'Edit Land Parcel'}
            </h1>
            <p className="text-xs text-[#687168] dark:text-stone-400">
              Link surveyed acreage, soil type, and irrigation source to a registered farmer.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={loading || (mode === 'edit' && !isDirty)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white shadow-xs transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{mode === 'create' ? 'Save Land Parcel' : 'Update Parcel'}</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Farmer & Survey Reference */}
        <div className="rounded-xl border border-[#E3E8DF] dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-[#252B26] dark:text-stone-100 mb-4 pb-2 border-b border-[#E3E8DF] dark:border-stone-800 flex items-center gap-2">
            <Map className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
            <span>Farmer Association &amp; Survey Reference</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Select Registered Farmer *
              </label>
              <select
                {...register('farmerId')}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.farmerId ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20' : 'border-[#E3E8DF] dark:border-stone-700'
                } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]`}
              >
                <option value="">-- Choose Farmer --</option>
                {farmers.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.farmerCode}) - {f.district}
                  </option>
                ))}
              </select>
              {errors.farmerId && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{errors.farmerId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Survey Number / Patta Passbook *
              </label>
              <input
                type="text"
                {...register('surveyNumber')}
                placeholder="e.g. 142/3A"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.surveyNumber ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20' : 'border-[#E3E8DF] dark:border-stone-700'
                } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
              />
              {errors.surveyNumber && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{errors.surveyNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Parcel / Field Name
              </label>
              <input
                type="text"
                {...register('parcelName')}
                placeholder="e.g. North Canal Plot"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Soil & Irrigation Profile */}
        <div className="rounded-xl border border-[#E3E8DF] dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-[#252B26] dark:text-stone-100 mb-4 pb-2 border-b border-[#E3E8DF] dark:border-stone-800 flex items-center gap-2">
            <Droplet className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
            <span>Acreage, Soil &amp; Irrigation Capacity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Total Area (Acres) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('totalAreaAcres')}
                placeholder="2.5"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]"
              />
              {errors.totalAreaAcres && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{errors.totalAreaAcres.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Cultivable Area (Acres) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('cultivableAreaAcres')}
                placeholder="2.5"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Soil Classification
              </label>
              <select
                {...register('soilType')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
              >
                <option value="alluvial">Alluvial Loam (Fertile Delta)</option>
                <option value="black_cotton">Black Cotton Soil (Regur)</option>
                <option value="red_loam">Red Sandy Loam</option>
                <option value="clayey">Deep Clayey (High Water Holding)</option>
                <option value="sandy_loam">Sandy Loam</option>
                <option value="laterite">Laterite Soil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Primary Irrigation Source
              </label>
              <select
                {...register('irrigationSource')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
              >
                <option value="borewell">Borewell with Submersible Pump</option>
                <option value="canal">Canal Irrigation (River Delta)</option>
                <option value="open_well">Open Well</option>
                <option value="drip">Drip Fertigation System</option>
                <option value="sprinkler">Sprinkler Irrigation</option>
                <option value="rainfed">Purely Rainfed (Monsoon Dependent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Water Availability (Months/Year)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                {...register('waterAvailabilityMonths')}
                placeholder="8"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                District Jurisdiction
              </label>
              <input
                type="text"
                {...register('district')}
                placeholder="e.g. Thanjavur"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
