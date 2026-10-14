'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, FileText, FlaskConical } from 'lucide-react';
import Link from 'next/link';

interface FarmerOption {
  _id: string;
  name: string;
  farmerCode: string;
  phone: string;
  district: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  surveyNumber: string;
  totalAreaAcres: number;
  farmerId: string | { _id: string };
  soilType: string;
}

interface SoilReportFormProps {
  initialData?: {
    _id?: string;
    farmerId: string | { _id: string };
    farmId: string | { _id: string };
    testDate?: string;
    testingLabName: string;
    testingLabCode?: string;
    sampleDepthInches?: number;
    parameters: {
      pH: number;
      electricalConductivity: number;
      organicCarbon: number;
      nitrogen: number;
      phosphorus: number;
      potassium: number;
      sulphur?: number;
      zinc?: number;
      boron?: number;
      iron?: number;
      manganese?: number;
      copper?: number;
    };
    notes?: string;
    status?: string;
  };
  mode: 'create' | 'edit';
}

export function SoilReportForm({ initialData, mode }: SoilReportFormProps) {
  const router = useRouter();

  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [allFarms, setAllFarms] = useState<FarmOption[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [formData, setFormData] = useState({
    farmerId: typeof initialData?.farmerId === 'object' ? initialData.farmerId._id : initialData?.farmerId || '',
    farmId: typeof initialData?.farmId === 'object' ? initialData.farmId._id : initialData?.farmId || '',
    testDate: initialData?.testDate ? initialData.testDate.split('T')[0] : new Date().toISOString().split('T')[0],
    testingLabName: initialData?.testingLabName || '',
    testingLabCode: initialData?.testingLabCode || '',
    sampleDepthInches: initialData?.sampleDepthInches || 6,
    parameters: {
      pH: initialData?.parameters?.pH ?? 6.8,
      electricalConductivity: initialData?.parameters?.electricalConductivity ?? 0.45,
      organicCarbon: initialData?.parameters?.organicCarbon ?? 0.58,
      nitrogen: initialData?.parameters?.nitrogen ?? 310,
      phosphorus: initialData?.parameters?.phosphorus ?? 24,
      potassium: initialData?.parameters?.potassium ?? 195,
      sulphur: initialData?.parameters?.sulphur ?? 12,
      zinc: initialData?.parameters?.zinc ?? 0.75,
      boron: initialData?.parameters?.boron ?? 0.5,
      iron: initialData?.parameters?.iron ?? 4.5,
      manganese: initialData?.parameters?.manganese ?? 3.2,
      copper: initialData?.parameters?.copper ?? 1.1,
    },
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [farmersRes, farmsRes] = await Promise.all([
          fetch('/api/farmers'),
          fetch('/api/farms'),
        ]);

        const farmersJson = await farmersRes.json();
        const farmsJson = await farmsRes.json();

        if (farmersJson.success) setFarmers(farmersJson.data || []);
        if (farmsJson.success) setAllFarms(farmsJson.data || []);
      } catch {
        setServerError('Failed to load farmer & land parcel registries.');
      } finally {
        setLoadingLookups(false);
      }
    }
    loadOptions();
  }, []);

  // Filter farms by chosen farmer
  const filteredFarms = allFarms.filter((farm) => {
    const fId = typeof farm.farmerId === 'object' ? farm.farmerId._id : farm.farmerId;
    return !formData.farmerId || fId === formData.farmerId;
  });

  const handleParamChange = (key: string, val: string) => {
    const num = parseFloat(val);
    setFormData((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const newErrors: Record<string, string> = {};
    if (!formData.farmerId) newErrors.farmerId = 'Farmer selection is required';
    if (!formData.farmId) newErrors.farmId = 'Farm parcel selection is required';
    if (!formData.testingLabName.trim()) newErrors.testingLabName = 'Lab name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const url = mode === 'create' ? '/api/soil-reports' : `/api/soil-reports/${initialData?._id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors);
        else setServerError(json.message || 'Operation failed');
        return;
      }

      router.push('/soil-reports');
      router.refresh();
    } catch {
      setServerError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {serverError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{serverError}</p>
        </div>
      )}

      {/* Basic Metadata */}
      <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="border-b border-[#245C3A]/10 pb-4">
          <h2 className="text-xl font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#245C3A]" />
            Lab Test Sample Information
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Map this laboratory soil test to a registered farmer and land parcel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Farmer Selector */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Farmer <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.farmerId}
              disabled={loadingLookups}
              onChange={(e) => {
                const newFarmerId = e.target.value;
                setFormData((prev) => ({ ...prev, farmerId: newFarmerId, farmId: '' }));
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            >
              <option value="">-- Choose Registered Farmer --</option>
              {farmers.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.farmerCode}) — {f.district}
                </option>
              ))}
            </select>
            {errors.farmerId && <p className="text-xs text-red-500 mt-1">{errors.farmerId}</p>}
          </div>

          {/* Farm Parcel Selector */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Land Parcel <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.farmId}
              disabled={!formData.farmerId || loadingLookups}
              onChange={(e) => setFormData((prev) => ({ ...prev, farmId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            >
              <option value="">
                {!formData.farmerId ? '-- Select Farmer First --' : '-- Choose Land Parcel --'}
              </option>
              {filteredFarms.map((fm) => (
                <option key={fm._id} value={fm._id}>
                  {fm.parcelName} (Survey: {fm.surveyNumber}) — {fm.totalAreaAcres} Acres ({fm.soilType})
                </option>
              ))}
            </select>
            {errors.farmId && <p className="text-xs text-red-500 mt-1">{errors.farmId}</p>}
          </div>

          {/* Testing Lab Name */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Soil Testing Lab Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ICAR-KVK Soil Testing Center"
              value={formData.testingLabName}
              onChange={(e) => setFormData((prev) => ({ ...prev, testingLabName: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
            {errors.testingLabName && <p className="text-xs text-red-500 mt-1">{errors.testingLabName}</p>}
          </div>

          {/* Test Date */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Sampling & Testing Date
            </label>
            <input
              type="date"
              value={formData.testDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, testDate: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
          </div>
        </div>
      </div>

      {/* 12 Soil Health Card Parameters */}
      <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="border-b border-[#245C3A]/10 pb-4">
          <h2 className="text-xl font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#245C3A]" />
            ICAR Soil Health Card Chemical Parameters
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Enter physical and chemical lab readings. These feed into the agronomic AI analysis engine.
          </p>
        </div>

        {/* Primary Nutrients & Reaction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
              pH (Soil Reaction) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.05"
              value={formData.parameters.pH}
              onChange={(e) => handleParamChange('pH', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
            <span className="text-[11px] text-stone-400">Benchmark: 6.5 - 7.5</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
              Electrical Cond. (EC dS/m) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.parameters.electricalConductivity}
              onChange={(e) => handleParamChange('electricalConductivity', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
            <span className="text-[11px] text-stone-400">Benchmark: &lt; 1.0 dS/m</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
              Organic Carbon (OC %) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.parameters.organicCarbon}
              onChange={(e) => handleParamChange('organicCarbon', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
            <span className="text-[11px] text-stone-400">Benchmark: 0.50 - 0.75 %</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
              Available Nitrogen (N kg/ha) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              value={formData.parameters.nitrogen}
              onChange={(e) => handleParamChange('nitrogen', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
            <span className="text-[11px] text-stone-400">Benchmark: 280 - 560 kg/ha</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
              Available Phosphorus (P kg/ha) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.parameters.phosphorus}
              onChange={(e) => handleParamChange('phosphorus', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
            <span className="text-[11px] text-stone-400">Benchmark: 23 - 56 kg/ha</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
              Available Potassium (K kg/ha) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              value={formData.parameters.potassium}
              onChange={(e) => handleParamChange('potassium', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
            />
            <span className="text-[11px] text-stone-400">Benchmark: 140 - 280 kg/ha</span>
          </div>
        </div>

        {/* Micronutrients */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">
            Micronutrients (Secondary & Trace Elements in ppm)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Sulphur (S)</label>
              <input
                type="number"
                step="0.1"
                value={formData.parameters.sulphur}
                onChange={(e) => handleParamChange('sulphur', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Zinc (Zn)</label>
              <input
                type="number"
                step="0.05"
                value={formData.parameters.zinc}
                onChange={(e) => handleParamChange('zinc', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Boron (B)</label>
              <input
                type="number"
                step="0.05"
                value={formData.parameters.boron}
                onChange={(e) => handleParamChange('boron', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Iron (Fe)</label>
              <input
                type="number"
                step="0.1"
                value={formData.parameters.iron}
                onChange={(e) => handleParamChange('iron', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Manganese (Mn)</label>
              <input
                type="number"
                step="0.1"
                value={formData.parameters.manganese}
                onChange={(e) => handleParamChange('manganese', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Copper (Cu)</label>
              <input
                type="number"
                step="0.05"
                value={formData.parameters.copper}
                onChange={(e) => handleParamChange('copper', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
            Agronomist Notes / Lab Observations
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Red loamy soil with moderate compaction, tested after summer rains..."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#245C3A]"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Link
          href="/soil-reports"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white font-semibold shadow-lg shadow-[#245C3A]/20 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {submitting ? 'Saving Report...' : mode === 'create' ? 'Save Soil Test Report' : 'Update Soil Report'}
        </button>
      </div>
    </form>
  );
}
