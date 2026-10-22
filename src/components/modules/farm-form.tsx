'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, Save, Map, Droplet, ArrowRightLeft } from 'lucide-react';
import { farmSchema, FarmInput } from '@/validators/farm.validator';
import Link from 'next/link';

interface FarmFormProps {
  mode: 'create' | 'edit';
  farmId?: string;
  initialData?: Partial<FarmInput>;
}

export type AreaUnit = 'acres' | 'cents' | 'hectares' | 'grounds' | 'guntha';

export const AREA_UNITS: { key: AreaUnit; label: string; toAcres: (val: number) => number }[] = [
  {
    key: 'acres',
    label: 'Acres',
    toAcres: (v: number) => v,
  },
  {
    key: 'cents',
    label: 'Cents',
    toAcres: (v: number) => Number((v * 0.01).toFixed(4)),
  },
  {
    key: 'hectares',
    label: 'Hectares',
    toAcres: (v: number) => Number((v * 2.47105).toFixed(4)),
  },
  {
    key: 'grounds',
    label: 'Grounds',
    toAcres: (v: number) => Number((v * 0.055096).toFixed(4)),
  },
  {
    key: 'guntha',
    label: 'Guntha',
    toAcres: (v: number) => Number((v * 0.025).toFixed(4)),
  },
];

export function FarmForm({ mode, farmId, initialData }: FarmFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState<
    { _id: string; name: string; farmerCode: string; district: string }[]
  >([]);
  const [districts, setDistricts] = useState<string[]>([]);

  // Area Units state (Allows entering in Acres, Cents, Hectares, Grounds, or Guntha)
  const [totalAreaUnit, setTotalAreaUnit] = useState<AreaUnit>('acres');
  const [totalAreaInput, setTotalAreaInput] = useState<string>(
    initialData?.totalAreaAcres ? String(initialData.totalAreaAcres) : ''
  );

  const [cultivableAreaUnit, setCultivableAreaUnit] = useState<AreaUnit>('acres');
  const [cultivableAreaInput, setCultivableAreaInput] = useState<string>(
    initialData?.cultivableAreaAcres ? String(initialData.cultivableAreaAcres) : ''
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [farmersRes, distRes] = await Promise.all([
          fetch('/api/farmers'),
          fetch('/api/locations?action=districts&state=Tamil%20Nadu'),
        ]);
        if (farmersRes.ok) {
          const json = await farmersRes.json();
          setFarmers(json.data || []);
        }
        if (distRes.ok) {
          const distJson = await distRes.json();
          if (distJson.success && Array.isArray(distJson.data)) {
            setDistricts(distJson.data);
          }
        }
      } catch {
        console.error('Failed to load farm form dependencies');
      }
    }
    loadData();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FarmInput>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      farmerId: initialData?.farmerId || '',
      surveyNumber: initialData?.surveyNumber || '',
      parcelName: initialData?.parcelName || '',
      totalAreaAcres: initialData?.totalAreaAcres || ('' as unknown as number),
      cultivableAreaAcres: initialData?.cultivableAreaAcres || ('' as unknown as number),
      soilType: (initialData?.soilType || '') as FarmInput['soilType'],
      irrigationSource: (initialData?.irrigationSource || '') as FarmInput['irrigationSource'],
      waterAvailabilityMonths: initialData?.waterAvailabilityMonths || ('' as unknown as number),
      village: initialData?.village || '',
      district: initialData?.district || '',
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
        parcelName: initialData.parcelName || '',
        totalAreaAcres: initialData.totalAreaAcres || ('' as unknown as number),
        cultivableAreaAcres: initialData.cultivableAreaAcres || ('' as unknown as number),
        soilType: (initialData.soilType || '') as FarmInput['soilType'],
        irrigationSource: (initialData.irrigationSource || '') as FarmInput['irrigationSource'],
        waterAvailabilityMonths: initialData.waterAvailabilityMonths || ('' as unknown as number),
        village: initialData.village || '',
        district: initialData.district || '',
        state: initialData.state || 'Tamil Nadu',
        status: initialData.status || 'active',
      });
      if (initialData.totalAreaAcres) {
        setTotalAreaInput(String(initialData.totalAreaAcres));
        setTotalAreaUnit('acres');
      }
      if (initialData.cultivableAreaAcres) {
        setCultivableAreaInput(String(initialData.cultivableAreaAcres));
        setCultivableAreaUnit('acres');
      }
    }
  }, [initialData, reset]);

  // Handle Total Area input & unit change
  const handleTotalAreaInput = (rawVal: string, unit: AreaUnit) => {
    setTotalAreaInput(rawVal);
    const num = parseFloat(rawVal);
    const unitConfig = AREA_UNITS.find((u) => u.key === unit);
    if (!isNaN(num) && num > 0 && unitConfig) {
      const convertedAcres = unitConfig.toAcres(num);
      setValue('totalAreaAcres', convertedAcres, { shouldValidate: true });
    } else {
      setValue('totalAreaAcres', '' as unknown as number, { shouldValidate: true });
    }
  };

  // Handle Cultivable Area input & unit change
  const handleCultivableAreaInput = (rawVal: string, unit: AreaUnit) => {
    setCultivableAreaInput(rawVal);
    const num = parseFloat(rawVal);
    const unitConfig = AREA_UNITS.find((u) => u.key === unit);
    if (!isNaN(num) && num > 0 && unitConfig) {
      const convertedAcres = unitConfig.toAcres(num);
      setValue('cultivableAreaAcres', convertedAcres, { shouldValidate: true });
    } else {
      setValue('cultivableAreaAcres', '' as unknown as number, { shouldValidate: true });
    }
  };

  const calculatedTotalAcres = watch('totalAreaAcres');
  const calculatedCultivableAcres = watch('cultivableAreaAcres');

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
    <div className="w-full space-y-6">
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

      {/* Unified Form in Single Card */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xs space-y-8">
          {/* Section 1: Farmer & Survey Reference */}
          <div>
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
                    errors.farmerId
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-[#E3E8DF] dark:border-stone-700'
                  } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]`}
                >
                  <option value="">-- Choose Registered Farmer --</option>
                  {farmers.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.farmerCode}) - {f.district}
                    </option>
                  ))}
                </select>
                {errors.farmerId && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                    {errors.farmerId.message}
                  </p>
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
                    errors.surveyNumber
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-[#E3E8DF] dark:border-stone-700'
                  } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
                />
                {errors.surveyNumber && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                    {errors.surveyNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                  Parcel / Field Name *
                </label>
                <input
                  type="text"
                  {...register('parcelName')}
                  placeholder="e.g. Main Field / North Plot"
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    errors.parcelName
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-[#E3E8DF] dark:border-stone-700'
                  } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
                />
                {errors.parcelName && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                    {errors.parcelName.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="border-t border-[#E3E8DF] dark:border-stone-800" />

          {/* Section 2: Soil & Irrigation Profile */}
          <div>
            <h2 className="text-sm font-bold text-[#252B26] dark:text-stone-100 mb-4 pb-2 border-b border-[#E3E8DF] dark:border-stone-800 flex items-center gap-2">
              <Droplet className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
              <span>Acreage, Soil &amp; Irrigation Capacity</span>
            </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Area with Unit Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Total Land Area *
              </label>
              <div
                className={`flex rounded-lg border ${
                  errors.totalAreaAcres
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-[#E3E8DF] dark:border-stone-700'
                } overflow-hidden bg-white dark:bg-stone-800 focus-within:border-[#245C3A] transition-colors`}
              >
                <input
                  type="number"
                  step="any"
                  value={totalAreaInput}
                  onChange={(e) => handleTotalAreaInput(e.target.value, totalAreaUnit)}
                  placeholder="e.g. 2.5 or 100"
                  className="flex-1 px-3 py-2 text-xs bg-transparent text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none"
                />
                <select
                  value={totalAreaUnit}
                  onChange={(e) => {
                    const u = e.target.value as AreaUnit;
                    setTotalAreaUnit(u);
                    handleTotalAreaInput(totalAreaInput, u);
                  }}
                  className="bg-[#F1F5EE] dark:bg-stone-700 border-l border-[#E3E8DF] dark:border-stone-600 px-2 text-xs font-medium text-[#252B26] dark:text-stone-100 focus:outline-none cursor-pointer"
                >
                  {AREA_UNITS.map((u) => (
                    <option key={u.key} value={u.key}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conversion Preview */}
              {totalAreaInput && parseFloat(totalAreaInput) > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#245C3A] dark:text-emerald-400 font-medium">
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>
                    {totalAreaUnit !== 'acres'
                      ? `≈ ${Number(calculatedTotalAcres || 0).toFixed(3)} Acres`
                      : `= ${(parseFloat(totalAreaInput) * 100).toFixed(0)} Cents | ${(
                          parseFloat(totalAreaInput) / 2.47105
                        ).toFixed(2)} Hectares`}
                  </span>
                </div>
              )}

              {errors.totalAreaAcres && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {errors.totalAreaAcres.message}
                </p>
              )}
            </div>

            {/* Cultivable Area with Unit Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Cultivable Area *
              </label>
              <div
                className={`flex rounded-lg border ${
                  errors.cultivableAreaAcres
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-[#E3E8DF] dark:border-stone-700'
                } overflow-hidden bg-white dark:bg-stone-800 focus-within:border-[#245C3A] transition-colors`}
              >
                <input
                  type="number"
                  step="any"
                  value={cultivableAreaInput}
                  onChange={(e) => handleCultivableAreaInput(e.target.value, cultivableAreaUnit)}
                  placeholder="e.g. 2.5 or 100"
                  className="flex-1 px-3 py-2 text-xs bg-transparent text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none"
                />
                <select
                  value={cultivableAreaUnit}
                  onChange={(e) => {
                    const u = e.target.value as AreaUnit;
                    setCultivableAreaUnit(u);
                    handleCultivableAreaInput(cultivableAreaInput, u);
                  }}
                  className="bg-[#F1F5EE] dark:bg-stone-700 border-l border-[#E3E8DF] dark:border-stone-600 px-2 text-xs font-medium text-[#252B26] dark:text-stone-100 focus:outline-none cursor-pointer"
                >
                  {AREA_UNITS.map((u) => (
                    <option key={u.key} value={u.key}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conversion Preview */}
              {cultivableAreaInput && parseFloat(cultivableAreaInput) > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#245C3A] dark:text-emerald-400 font-medium">
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>
                    {cultivableAreaUnit !== 'acres'
                      ? `≈ ${Number(calculatedCultivableAcres || 0).toFixed(3)} Acres`
                      : `= ${(parseFloat(cultivableAreaInput) * 100).toFixed(0)} Cents | ${(
                          parseFloat(cultivableAreaInput) / 2.47105
                        ).toFixed(2)} Hectares`}
                  </span>
                </div>
              )}

              {errors.cultivableAreaAcres && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {errors.cultivableAreaAcres.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Soil Classification *
              </label>
              <select
                {...register('soilType')}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.soilType
                    ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-[#E3E8DF] dark:border-stone-700'
                } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]`}
              >
                <option value="">-- Select Soil Classification --</option>
                <option value="alluvial">Alluvial Loam (Fertile Delta)</option>
                <option value="black_cotton">Black Cotton Soil (Regur)</option>
                <option value="red_loam">Red Sandy Loam</option>
                <option value="clayey">Deep Clayey (High Water Holding)</option>
                <option value="sandy_loam">Sandy Loam</option>
                <option value="laterite">Laterite Soil</option>
              </select>
              {errors.soilType && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {errors.soilType.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Primary Irrigation Source *
              </label>
              <select
                {...register('irrigationSource')}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.irrigationSource
                    ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-[#E3E8DF] dark:border-stone-700'
                } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]`}
              >
                <option value="">-- Select Primary Irrigation Source --</option>
                <option value="borewell">Borewell with Submersible Pump</option>
                <option value="canal">Canal Irrigation (River Delta)</option>
                <option value="open_well">Open Well</option>
                <option value="drip">Drip Fertigation System</option>
                <option value="sprinkler">Sprinkler Irrigation</option>
                <option value="rainfed">Purely Rainfed (Monsoon Dependent)</option>
              </select>
              {errors.irrigationSource && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {errors.irrigationSource.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                Water Availability (Months/Year) *
              </label>
              <input
                type="number"
                min={1}
                max={12}
                {...register('waterAvailabilityMonths')}
                placeholder="e.g. 12"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.waterAvailabilityMonths
                    ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-[#E3E8DF] dark:border-stone-700'
                } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
              />
              {errors.waterAvailabilityMonths && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {errors.waterAvailabilityMonths.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                District Jurisdiction *
              </label>
              <select
                {...register('district')}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.district
                    ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-[#E3E8DF] dark:border-stone-700'
                } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]`}
              >
                <option value="">-- Select District --</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {errors.district.message}
                </p>
              )}
            </div>
            </div>
          </div>

          {/* Section Divider & Submit Action */}
          <div className="pt-4 border-t border-[#E3E8DF] dark:border-stone-800 flex items-center justify-end gap-3">
            <Link
              href="/farms"
              className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-[#E3E8DF] dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-[#252B26] dark:text-stone-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || (mode === 'edit' && !isDirty)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{mode === 'create' ? 'Save Land Parcel' : 'Update Parcel'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
