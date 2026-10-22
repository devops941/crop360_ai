'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  FileText,
  FlaskConical,
  UploadCloud,
  FileCheck2,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Cpu,
  X,
} from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [allFarms, setAllFarms] = useState<FarmOption[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Document Upload & AI Extraction State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionMsg, setExtractionMsg] = useState<{
    type: 'success' | 'error';
    text: string;
    count?: number;
    engine?: 'claude-ai' | 'gemini-ai' | 'smart-parser';
  } | null>(null);
  const [extractedKeys, setExtractedKeys] = useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);

  // Form State (initialized clean if mode is create)
  const [formData, setFormData] = useState({
    farmerId:
      typeof initialData?.farmerId === 'object'
        ? initialData.farmerId._id
        : initialData?.farmerId || '',
    farmId:
      typeof initialData?.farmId === 'object'
        ? initialData.farmId._id
        : initialData?.farmId || '',
    testDate: initialData?.testDate
      ? initialData.testDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
    testingLabName: initialData?.testingLabName || '',
    testingLabCode: initialData?.testingLabCode || '',
    sampleDepthInches: initialData?.sampleDepthInches || 6,
    parameters: {
      pH: initialData?.parameters?.pH ?? ('' as unknown as number),
      electricalConductivity:
        initialData?.parameters?.electricalConductivity ?? ('' as unknown as number),
      organicCarbon: initialData?.parameters?.organicCarbon ?? ('' as unknown as number),
      nitrogen: initialData?.parameters?.nitrogen ?? ('' as unknown as number),
      phosphorus: initialData?.parameters?.phosphorus ?? ('' as unknown as number),
      potassium: initialData?.parameters?.potassium ?? ('' as unknown as number),
      sulphur: initialData?.parameters?.sulphur ?? ('' as unknown as number),
      zinc: initialData?.parameters?.zinc ?? ('' as unknown as number),
      boron: initialData?.parameters?.boron ?? ('' as unknown as number),
      iron: initialData?.parameters?.iron ?? ('' as unknown as number),
      manganese: initialData?.parameters?.manganese ?? ('' as unknown as number),
      copper: initialData?.parameters?.copper ?? ('' as unknown as number),
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
        [key]: isNaN(num) ? ('' as unknown as number) : num,
      },
    }));
  };

  // Handle Document Upload & Auto-Extraction
  const processUploadedDocument = async (file: File) => {
    setUploadedFile(file);
    setIsExtracting(true);
    setExtractionMsg(null);
    setServerError(null);

    try {
      const formPayload = new FormData();
      formPayload.append('file', file);

      const res = await fetch('/api/soil-reports/extract', {
        method: 'POST',
        body: formPayload,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to extract data from document');
      }

      const extracted = json.data;
      const detected = extracted.parameters || {};
      const newExtractedKeys = new Set<string>();

      // Populate parameters
      setFormData((prev) => {
        const updatedParams = { ...prev.parameters };

        Object.entries(detected).forEach(([k, val]) => {
          if (val !== undefined && val !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (updatedParams as any)[k] = Number(val);
            newExtractedKeys.add(k);
          }
        });

        // Automatically select matched farmer if detected from report
        let targetFarmerId = prev.farmerId;
        if (extracted.farmerId) {
          targetFarmerId = extracted.farmerId;
        } else if (extracted.farmerCode || extracted.farmerName) {
          const matchFarmer = farmers.find(
            (f) =>
              (extracted.farmerCode && f.farmerCode?.toLowerCase() === extracted.farmerCode.toLowerCase()) ||
              (extracted.farmerName && f.name?.toLowerCase().includes(extracted.farmerName.toLowerCase()))
          );
          if (matchFarmer) targetFarmerId = matchFarmer._id;
        }

        // Automatically select matched farm parcel if detected from report
        let targetFarmId = prev.farmId;
        if (extracted.farmId) {
          targetFarmId = extracted.farmId;
        } else if (extracted.parcelName || extracted.surveyNumber) {
          const matchFarm = allFarms.find(
            (fm: FarmOption) =>
              (extracted.parcelName && fm.parcelName?.toLowerCase().includes(extracted.parcelName.toLowerCase())) ||
              (extracted.surveyNumber && fm.surveyNumber?.toLowerCase() === extracted.surveyNumber.toLowerCase())
          );
          if (matchFarm) targetFarmId = matchFarm._id;
        }

        return {
          ...prev,
          farmerId: targetFarmerId,
          farmId: targetFarmId,
          testingLabName: extracted.testingLabName || prev.testingLabName,
          testDate: extracted.testDate || prev.testDate,
          sampleDepthInches: extracted.sampleDepthInches || prev.sampleDepthInches,
          parameters: updatedParams,
        };
      });

      setExtractedKeys(newExtractedKeys);

      setExtractionMsg({
        type: 'success',
        text: json.message || `Extracted ${extracted.detectedCount} parameter(s) from "${file.name}" with ${extracted.confidence}% confidence!`,
        count: extracted.detectedCount,
        engine: extracted.engine || 'smart-parser',
      });
    } catch (err) {
      setExtractionMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error extracting text from document.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedDocument(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedDocument(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const newErrors: Record<string, string> = {};
    if (!formData.farmerId) newErrors.farmerId = 'Farmer selection is required';
    if (!formData.farmId) newErrors.farmId = 'Farm parcel selection is required';
    if (!formData.testingLabName.trim()) newErrors.testingLabName = 'Lab name is required';

    // Verify required primary parameters
    const p = formData.parameters;
    if (p.pH === '' as unknown as number || isNaN(Number(p.pH))) newErrors.pH = 'pH is required';
    if (
      p.electricalConductivity === '' as unknown as number ||
      isNaN(Number(p.electricalConductivity))
    )
      newErrors.electricalConductivity = 'EC is required';
    if (p.organicCarbon === '' as unknown as number || isNaN(Number(p.organicCarbon)))
      newErrors.organicCarbon = 'Organic Carbon is required';
    if (p.nitrogen === '' as unknown as number || isNaN(Number(p.nitrogen)))
      newErrors.nitrogen = 'Nitrogen is required';
    if (p.phosphorus === '' as unknown as number || isNaN(Number(p.phosphorus)))
      newErrors.phosphorus = 'Phosphorus is required';
    if (p.potassium === '' as unknown as number || isNaN(Number(p.potassium)))
      newErrors.potassium = 'Potassium is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {serverError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{serverError}</p>
        </div>
      )}

      {/* Unified Single Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#E3E8DF] dark:border-stone-800 p-6 md:p-8 space-y-8 shadow-xs">
        {/* 1. DOCUMENT UPLOAD & AI DATA EXTRACTION ZONE */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#245C3A]/10 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#245C3A]/10 dark:bg-[#245C3A]/20 flex items-center justify-center text-[#245C3A] dark:text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
                <span>Upload Soil Test Document</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  AI Extraction Active
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Upload your ICAR Soil Health Card, KVK/TNAU lab report (PDF, PNG, JPG, or Scanned Image).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/api/soil-reports/sample-pdf"
              download="Sample_ICAR_Soil_Report.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors shadow-sm"
              title="Download realistic ICAR Soil Health Card PDF to test upload"
            >
              <FileText className="w-3.5 h-3.5 text-[#245C3A] dark:text-emerald-400" />
              <span>Download Sample PDF</span>
            </a>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            isDragOver
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-2 border-[#245C3A]'
              : 'bg-[#FAFAF6] dark:bg-stone-900/60 hover:bg-emerald-50/40 border-2 border-dashed border-stone-300 dark:border-stone-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,.txt,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {isExtracting ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#245C3A]" />
              <p className="text-sm font-semibold text-[#245C3A] dark:text-emerald-400">
                Scanning document &amp; extracting 12 soil parameters...
              </p>
              <p className="text-xs text-stone-500">
                AI reading chemical parameters (pH, EC, N, P, K, S, micronutrients, lab name &amp; date)
              </p>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-[#245C3A] flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#193D2A] dark:text-stone-100">{uploadedFile.name}</p>
              <p className="text-xs text-stone-500">
                {(uploadedFile.size / 1024).toFixed(1)} KB &bull; Click or drop another file to re-scan
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="w-10 h-10 text-[#245C3A]/60" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                Drag and drop your Soil Report file here, or{' '}
                <span className="text-[#245C3A] underline font-bold">browse your device</span>
              </p>
              <p className="text-xs text-stone-400">Supports PDF, PNG, JPG, JPEG (Max 10MB)</p>
            </div>
          )}
        </div>

        {/* Extraction Status Feedback Banner - Modern Executive UI */}
        {extractionMsg && (
          <div
            className={`rounded-2xl p-4 border transition-all duration-300 ${
              extractionMsg.type === 'success'
                ? 'bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-[#162218] dark:to-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/80 shadow-xs'
                : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    extractionMsg.type === 'success'
                      ? 'bg-emerald-100 text-[#245C3A] dark:bg-emerald-900/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                  }`}
                >
                  {extractionMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      {extractionMsg.type === 'success' ? 'OCR Parameters Extracted' : 'Extraction Error'}
                    </span>
                    {extractionMsg.engine && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-700/60">
                        {extractionMsg.engine === 'gemini-ai' ? (
                          <>
                            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Gemini Vision AI</span>
                          </>
                        ) : extractionMsg.engine === 'claude-ai' ? (
                          <>
                            <Cpu className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>Claude AI</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Smart Soil Engine</span>
                          </>
                        )}
                      </span>
                    )}
                    {extractionMsg.count !== undefined && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        <span>{extractionMsg.count} Fields Populated</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                    {extractionMsg.text}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExtractionMsg(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Section Divider */}
        <div className="border-t border-[#E3E8DF] dark:border-stone-800" />

        {/* 2. Basic Metadata */}
        <div className="space-y-6">
          <div className="border-b border-[#245C3A]/10 dark:border-stone-800 pb-4">
          <h2 className="text-xl font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#245C3A]" />
            Lab Test Sample Information
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Map this laboratory soil test to a registered farmer and land parcel.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
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
            {errors.testingLabName && (
              <p className="text-xs text-red-500 mt-1">{errors.testingLabName}</p>
            )}
          </div>

          {/* Test Date */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Sampling &amp; Testing Date
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

      {/* Section Divider */}
      <div className="border-t border-[#E3E8DF] dark:border-stone-800" />

      {/* 3. 12 Soil Health Card Parameters */}
      <div className="space-y-6">
          <div className="border-b border-[#245C3A]/10 dark:border-stone-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#245C3A]" />
              ICAR Soil Health Card Chemical Parameters
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Physical and chemical lab readings. Auto-extracted from document or entered manually.
            </p>
          </div>
        </div>

        {/* Primary Nutrients & Reaction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
          {/* pH */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                pH (Soil Reaction) <span className="text-red-500">*</span>
              </label>
              {extractedKeys.has('pH') && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              )}
            </div>
            <input
              type="number"
              step="0.05"
              placeholder="e.g. 7.2"
              value={formData.parameters.pH}
              onChange={(e) => handleParamChange('pH', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.pH ? 'border-red-400 bg-red-50/20' : 'border-stone-300 dark:border-stone-700'
              } bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]`}
            />
            <span className="text-[11px] text-stone-400">Benchmark: 6.5 - 7.5</span>
            {errors.pH && <p className="text-xs text-red-500 mt-0.5">{errors.pH}</p>}
          </div>

          {/* EC */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Electrical Cond. (EC dS/m) <span className="text-red-500">*</span>
              </label>
              {extractedKeys.has('electricalConductivity') && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.35"
              value={formData.parameters.electricalConductivity}
              onChange={(e) => handleParamChange('electricalConductivity', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.electricalConductivity
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-stone-300 dark:border-stone-700'
              } bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]`}
            />
            <span className="text-[11px] text-stone-400">Benchmark: &lt; 1.0 dS/m</span>
            {errors.electricalConductivity && (
              <p className="text-xs text-red-500 mt-0.5">{errors.electricalConductivity}</p>
            )}
          </div>

          {/* OC */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Organic Carbon (OC %) <span className="text-red-500">*</span>
              </label>
              {extractedKeys.has('organicCarbon') && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.65"
              value={formData.parameters.organicCarbon}
              onChange={(e) => handleParamChange('organicCarbon', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.organicCarbon
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-stone-300 dark:border-stone-700'
              } bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]`}
            />
            <span className="text-[11px] text-stone-400">Benchmark: 0.50 - 0.75 %</span>
            {errors.organicCarbon && (
              <p className="text-xs text-red-500 mt-0.5">{errors.organicCarbon}</p>
            )}
          </div>

          {/* Nitrogen */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Available Nitrogen (N kg/ha) <span className="text-red-500">*</span>
              </label>
              {extractedKeys.has('nitrogen') && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              )}
            </div>
            <input
              type="number"
              step="1"
              placeholder="e.g. 295"
              value={formData.parameters.nitrogen}
              onChange={(e) => handleParamChange('nitrogen', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.nitrogen
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-stone-300 dark:border-stone-700'
              } bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]`}
            />
            <span className="text-[11px] text-stone-400">Benchmark: 280 - 560 kg/ha</span>
            {errors.nitrogen && <p className="text-xs text-red-500 mt-0.5">{errors.nitrogen}</p>}
          </div>

          {/* Phosphorus */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Available Phosphorus (P kg/ha) <span className="text-red-500">*</span>
              </label>
              {extractedKeys.has('phosphorus') && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              )}
            </div>
            <input
              type="number"
              step="0.5"
              placeholder="e.g. 28.5"
              value={formData.parameters.phosphorus}
              onChange={(e) => handleParamChange('phosphorus', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.phosphorus
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-stone-300 dark:border-stone-700'
              } bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]`}
            />
            <span className="text-[11px] text-stone-400">Benchmark: 23 - 56 kg/ha</span>
            {errors.phosphorus && (
              <p className="text-xs text-red-500 mt-0.5">{errors.phosphorus}</p>
            )}
          </div>

          {/* Potassium */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Available Potassium (K kg/ha) <span className="text-red-500">*</span>
              </label>
              {extractedKeys.has('potassium') && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              )}
            </div>
            <input
              type="number"
              step="1"
              placeholder="e.g. 240"
              value={formData.parameters.potassium}
              onChange={(e) => handleParamChange('potassium', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.potassium
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-stone-300 dark:border-stone-700'
              } bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#245C3A]`}
            />
            <span className="text-[11px] text-stone-400">Benchmark: 140 - 280 kg/ha</span>
            {errors.potassium && <p className="text-xs text-red-500 mt-0.5">{errors.potassium}</p>}
          </div>
        </div>

        {/* Micronutrients */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">
            Micronutrients (Secondary &amp; Trace Elements in ppm)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-500">Sulphur (S)</label>
                {extractedKeys.has('sulphur') && (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
                )}
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="16.0"
                value={formData.parameters.sulphur}
                onChange={(e) => handleParamChange('sulphur', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-500">Zinc (Zn)</label>
                {extractedKeys.has('zinc') && (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
                )}
              </div>
              <input
                type="number"
                step="0.05"
                placeholder="0.95"
                value={formData.parameters.zinc}
                onChange={(e) => handleParamChange('zinc', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-500">Boron (B)</label>
                {extractedKeys.has('boron') && (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
                )}
              </div>
              <input
                type="number"
                step="0.05"
                placeholder="0.58"
                value={formData.parameters.boron}
                onChange={(e) => handleParamChange('boron', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-500">Iron (Fe)</label>
                {extractedKeys.has('iron') && (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
                )}
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="6.2"
                value={formData.parameters.iron}
                onChange={(e) => handleParamChange('iron', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-500">Manganese (Mn)</label>
                {extractedKeys.has('manganese') && (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
                )}
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="4.1"
                value={formData.parameters.manganese}
                onChange={(e) => handleParamChange('manganese', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-500">Copper (Cu)</label>
                {extractedKeys.has('copper') && (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
                )}
              </div>
              <input
                type="number"
                step="0.05"
                placeholder="1.4"
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

        {/* Section Divider & Action Buttons Aligned Right */}
        <div className="pt-6 border-t border-[#E3E8DF] dark:border-stone-800 flex items-center justify-end gap-3">
          <Link
            href="/soil-reports"
            className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {submitting
                ? 'Saving Report...'
                : mode === 'create'
                ? 'Save Soil Test Report'
                : 'Update Soil Report'}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
