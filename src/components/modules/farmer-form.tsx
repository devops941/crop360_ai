'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, Save, User, Phone, Mail, MapPin, Globe, AlertCircle } from 'lucide-react';
import { farmerSchema, FarmerInput } from '@/validators/farmer.validator';
import { LocationSelector } from '@/components/modules/location-selector';
import Link from 'next/link';

interface FarmerFormProps {
  mode: 'create' | 'edit';
  farmerId?: string;
  initialData?: Partial<FarmerInput>;
}

export function FarmerForm({ mode, farmerId, initialData }: FarmerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const defaultFormValues: FarmerInput = {
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    aadhaarLastFour: initialData?.aadhaarLastFour || '',
    category: (initialData?.category as FarmerInput['category']) || 'small',
    village: initialData?.village || '',
    panchayat: initialData?.panchayat || '',
    taluk: initialData?.taluk || '',
    district: initialData?.district || 'Thanjavur',
    state: initialData?.state || 'Tamil Nadu',
    pincode: initialData?.pincode || '',
    preferredLanguage: (initialData?.preferredLanguage as FarmerInput['preferredLanguage']) || 'ta',
    status: (initialData?.status as FarmerInput['status']) || 'active',
  };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FarmerInput>({
    resolver: zodResolver(farmerSchema),
    defaultValues: defaultFormValues,
    values: initialData ? (defaultFormValues as FarmerInput) : undefined,
  });

  // Sync initialData reliably whenever it arrives or changes
  React.useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        aadhaarLastFour: initialData.aadhaarLastFour || '',
        category: (initialData.category as FarmerInput['category']) || 'small',
        village: initialData.village || '',
        panchayat: initialData.panchayat || '',
        taluk: initialData.taluk || '',
        district: initialData.district || 'Thanjavur',
        state: initialData.state || 'Tamil Nadu',
        pincode: initialData.pincode || '',
        preferredLanguage: (initialData.preferredLanguage as FarmerInput['preferredLanguage']) || 'ta',
        status: (initialData.status as FarmerInput['status']) || 'active',
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (values: FarmerInput) => {
    setLoading(true);
    setBackendError(null);
    try {
      const url = mode === 'create' ? '/api/farmers' : `/api/farmers/${farmerId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        // If the backend returns detailed field-level errors, map them below individual fields
        if (data.error?.details && typeof data.error.details === 'object') {
          const details = data.error.details as Record<string, unknown>;
          Object.keys(details).forEach((field) => {
            const fieldError = details[field];
            const msg =
              typeof fieldError === 'string'
                ? fieldError
                : Array.isArray((fieldError as { _errors?: string[] })?._errors)
                ? (fieldError as { _errors: string[] })._errors.join(', ')
                : String(fieldError);
            if (msg) {
              setError(field as keyof FarmerInput, { message: msg });
            }
          });
        }

        const errorDetails = data.error?.details
          ? typeof data.error.details === 'string'
            ? data.error.details
            : Object.values(data.error.details)
                .map((v) => (typeof v === 'object' && v && '_errors' in v ? (v as { _errors: string[] })._errors.join(', ') : String(v)))
                .filter(Boolean)
                .join(', ')
          : data.message;

        const mainMsg = data.message || errorDetails || 'Failed to save farmer record';
        setBackendError(mainMsg);
        toast.error(mainMsg);
        return;
      }

      toast.success(
        mode === 'create'
          ? `Farmer ${data.data.name} (${data.data.farmerCode}) registered!`
          : `Farmer details updated successfully!`
      );

      router.push('/farmers');
      router.refresh();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Operation failed';
      setBackendError(errMessage);
      toast.error(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/farmers"
            className="p-2 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-200 hover:bg-[#F1F5EE] dark:hover:bg-stone-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#252B26] dark:text-stone-100">
              {mode === 'create' ? 'Register New Farmer' : `Edit Farmer Record`}
            </h1>
            <p className="text-xs text-[#687168] dark:text-stone-400">
              {mode === 'create'
                ? 'Create a unified farmer master record for soil reports and land parcels.'
                : 'Update contact details, category, or administrative location.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={loading || (mode === 'edit' && !isDirty)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{mode === 'create' ? 'Save Farmer' : 'Update Record'}</span>
        </button>
      </div>

      {/* Backend Error Banner / Popup */}
      {backendError && (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">Backend Error Encountered</p>
              <p className="text-xs mt-0.5 text-rose-700 dark:text-rose-400 leading-relaxed">{backendError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBackendError(null)}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unified Form in Single Card */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xs space-y-8">
          {/* Section 1: Personal & Contact */}
          <div>
            <h2 className="text-sm font-bold text-[#252B26] dark:text-stone-100 mb-4 pb-2 border-b border-[#E3E8DF] dark:border-stone-800 flex items-center gap-2">
              <User className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
              <span>Personal &amp; Contact Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Ramesh Kumar"
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    errors.name
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-[#E3E8DF] dark:border-stone-700'
                  } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
                />
                {errors.name && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                  Mobile Number (10 Digits) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  {...register('phone')}
                  placeholder="9876543210"
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    errors.phone
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-[#E3E8DF] dark:border-stone-700'
                  } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="farmer@example.com"
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    errors.email
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-[#E3E8DF] dark:border-stone-700'
                  } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                  Aadhaar (Last 4 Digits)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  {...register('aadhaarLastFour')}
                  placeholder="e.g. 5432"
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    errors.aadhaarLastFour
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-[#E3E8DF] dark:border-stone-700'
                  } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
                />
                {errors.aadhaarLastFour && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.aadhaarLastFour.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                  Farmer Landholding Category
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                >
                  <option value="marginal">Marginal (Below 1 Hectare / 2.5 Acres)</option>
                  <option value="small">Small (1 to 2 Hectares / 2.5 - 5 Acres)</option>
                  <option value="medium">Medium (2 to 10 Hectares)</option>
                  <option value="large">Large (Above 10 Hectares / 25 Acres)</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
                  Preferred Advisory Language
                </label>
                <select
                  {...register('preferredLanguage')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]"
                >
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
                {errors.preferredLanguage && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.preferredLanguage.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="border-t border-[#E3E8DF] dark:border-stone-800" />

          {/* Section 2: Address & Regional Jurisdiction */}
          <div>
            <h2 className="text-sm font-bold text-[#252B26] dark:text-stone-100 mb-4 pb-2 border-b border-[#E3E8DF] dark:border-stone-800 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
              <span>Village &amp; Administrative Location</span>
            </h2>

            <LocationSelector
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
              disabled={loading}
            />
          </div>

          {/* Section Divider & Submit Action */}
          <div className="pt-4 border-t border-[#E3E8DF] dark:border-stone-800 flex items-center justify-end gap-3">
            <Link
              href="/farmers"
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
              <span>{mode === 'create' ? 'Save Farmer' : 'Update Record'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
