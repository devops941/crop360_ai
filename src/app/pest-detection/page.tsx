'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bug,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  ShieldAlert,
  ArrowRight,
  Eye,
  Loader2,
  X,
  Sparkles,
  Leaf,
  ShieldCheck,
  Stethoscope,
  Info,
} from 'lucide-react';

interface PestDetectionRecord {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string; district?: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; soilType?: string };
  sowingId?: { _id: string; cropName: string; varietyName: string };
  cropName: string;
  detectedCategory: string;
  pestDiseaseName: string;
  scientificName?: string;
  confidenceScorePercent: number;
  affectedPlantParts: string[];
  severityLevel: 'mild' | 'moderate' | 'critical';
  economicThresholdLevelETL: string;
  symptomsDescription?: string;
  photoUrl?: string;
  status: 'active' | 'under_treatment' | 'resolved';
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
}

const COMMON_PEST_PRESETS = [
  {
    crop: 'Paddy / Rice',
    name: 'Brown Planthopper (BPH)',
    scientific: 'Nilaparvata lugens',
    category: 'insect_pest',
    severity: 'critical',
    etl: '5-10 hoppers per hill during vegetative stage',
    symptoms: 'Hopper burn symptoms, circular drying patches in center of field, sooty mold growth.',
    parts: ['stem', 'leaf'],
  },
  {
    crop: 'Paddy / Rice',
    name: 'Rice Blast (Pyricularia oryzae)',
    scientific: 'Magnaporthe oryzae',
    category: 'fungal_disease',
    severity: 'critical',
    etl: '2-5% spindle lesions on upper canopy leaves',
    symptoms: 'Spindle-shaped diamond spots with grey-white centers and reddish-brown borders.',
    parts: ['leaf', 'stem', 'panicle'],
  },
  {
    crop: 'Maize / Corn',
    name: 'Fall Armyworm (FAW)',
    scientific: 'Spodoptera frugiperda',
    category: 'insect_pest',
    severity: 'critical',
    etl: '10% damaged whorls in seedling or early whorl stage',
    symptoms: 'Pinholes in leaves, window-pane skeletonized whorls, extensive sawdust-like frass.',
    parts: ['leaf', 'stem'],
  },
  {
    crop: 'Cotton',
    name: 'Cotton Whitefly',
    scientific: 'Bemisia tabaci',
    category: 'insect_pest',
    severity: 'moderate',
    etl: '6-8 adults per leaf or leaf curl symptom onset',
    symptoms: 'Sap sucking causing leaf curl virus vector transmission, honeydew excretion and black mold.',
    parts: ['leaf'],
  },
  {
    crop: 'Groundnut / Peanut',
    name: 'Tikka Leaf Spot (Cercospora)',
    scientific: 'Cercospora arachidicola',
    category: 'fungal_disease',
    severity: 'moderate',
    etl: '1-2 lesions per plant prior to pegging',
    symptoms: 'Subcircular dark brown spots surrounded by prominent yellow chlorotic halos.',
    parts: ['leaf'],
  },
];

export default function PestDetectionPage() {
  const [detections, setDetections] = useState<PestDetectionRecord[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmId: '',
    cropName: 'Paddy / Rice',
    pestDiseaseName: 'Brown Planthopper (BPH)',
    scientificName: 'Nilaparvata lugens',
    detectedCategory: 'insect_pest',
    severityLevel: 'critical',
    confidenceScorePercent: 94,
    economicThresholdLevelETL: '5-10 hoppers per hill during vegetative stage',
    symptomsDescription: 'Hopper burn symptoms, circular drying patches in center of field.',
    affectedPlantParts: 'stem, leaf',
    photoUrl: '',
    status: 'active',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [detectRes, farmRes] = await Promise.all([
        fetch('/api/pest-detection'),
        fetch('/api/farms'),
      ]);

      if (detectRes.ok) {
        const json = await detectRes.json();
        setDetections(json.data || []);
      }
      if (farmRes.ok) {
        const json = await farmRes.json();
        setFarms(json.data || []);
        if (json.data?.length > 0 && !formData.farmId) {
          setFormData((prev) => ({ ...prev, farmId: json.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error loading pest detection data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePresetSelect = (preset: (typeof COMMON_PEST_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      cropName: preset.crop,
      pestDiseaseName: preset.name,
      scientificName: preset.scientific,
      detectedCategory: preset.category,
      severityLevel: preset.severity,
      economicThresholdLevelETL: preset.etl,
      symptomsDescription: preset.symptoms,
      affectedPlantParts: preset.parts.join(', '),
      confidenceScorePercent: Math.floor(Math.random() * 8 + 91),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmId) {
      alert('Please select a farm parcel');
      return;
    }
    const selectedFarm = farms.find((f) => f._id === formData.farmId);
    if (!selectedFarm) {
      alert('Selected farm not found');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/pest-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          cropName: formData.cropName,
          pestDiseaseName: formData.pestDiseaseName,
          scientificName: formData.scientificName,
          detectedCategory: formData.detectedCategory,
          severityLevel: formData.severityLevel,
          confidenceScorePercent: Number(formData.confidenceScorePercent),
          economicThresholdLevelETL: formData.economicThresholdLevelETL,
          symptomsDescription: formData.symptomsDescription,
          affectedPlantParts: formData.affectedPlantParts.split(',').map((s) => s.trim()),
          photoUrl: formData.photoUrl || undefined,
          status: formData.status,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save diagnostic report');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving diagnosis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/pest-detection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setDetections((prev) =>
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

  const filtered = detections.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && d.detectedCategory !== categoryFilter) return false;
    return true;
  });

  const activeCount = detections.filter((d) => d.status === 'active').length;
  const criticalCount = detections.filter((d) => d.severityLevel === 'critical' && d.status !== 'resolved').length;
  const avgConfidence = detections.length
    ? Math.round(detections.reduce((acc, c) => acc + (c.confidenceScorePercent || 0), 0) / detections.length)
    : 92;
  const resolvedCount = detections.filter((d) => d.status === 'resolved').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E7EFE6] dark:bg-[#1e3826] text-[#245C3A] dark:text-[#8ee0a8] border border-[#CFDEC9] dark:border-[#2d5c3a]">
              Module 13 &bull; Phase 5
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5" /> AI Vision & Symptom Diagnostics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Pest & Disease Detection Engine
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Identify leaf blights, fungal infections, insect infestations, and ETL economic threshold breaches with computer vision and ICAR taxonomic keys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/crop-protection"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Module 14: IPM Protection
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Log Diagnosis Report
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Active Infestations</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bug className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{activeCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Unresolved canopy threats</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Critical ETL Breaches</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{criticalCount}</div>
          <p className="mt-1 text-[11px] text-red-700/80 dark:text-red-300">Requires emergency spray</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Avg AI Confidence</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{avgConfidence}%</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Computer vision certainty</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Resolved Incidents</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#245C3A] dark:text-emerald-400">{resolvedCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Controlled via IPM sprays</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-600 dark:text-[#a0b5a3] mr-2">Filter By:</span>
          {['all', 'active', 'under_treatment', 'resolved'].map((s) => (
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

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border border-[#E3E8DF] dark:border-[#245C3A]/40 bg-white dark:bg-[#121c14] text-stone-800 dark:text-stone-200 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="insect_pest">Insect Pests</option>
            <option value="fungal_disease">Fungal Blights / Spots</option>
            <option value="bacterial_disease">Bacterial Diseases</option>
            <option value="viral_disease">Viral Diseases</option>
            <option value="nutrient_deficiency">Nutrient Deficiencies</option>
          </select>
        </div>
      </div>

      {/* Detection Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Scanning crop pathology database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <Leaf className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">Clean Bill of Health!</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            No active pest or disease detections recorded. Click "Log Diagnosis Report" to register field observations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isCritical = item.severityLevel === 'critical';
            const isModerate = item.severityLevel === 'moderate';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 dark:hover:border-emerald-500/50 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                          : isModerate
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {item.severityLevel} severity &bull; {item.confidenceScorePercent}% AI confidence
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        item.status === 'active'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                          : item.status === 'under_treatment'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                    {item.pestDiseaseName}
                  </h3>
                  {item.scientificName && (
                    <p className="text-xs italic text-stone-500 dark:text-[#a0b5a3] mt-0.5">
                      {item.scientificName}
                    </p>
                  )}

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-stone-100 dark:border-[#245C3A]/20">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Crop & Parcel:</span>
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {item.cropName} &bull; {item.farmId?.parcelName || 'Farm'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100 dark:border-[#245C3A]/20">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Category:</span>
                      <span className="font-medium text-stone-700 dark:text-stone-300 capitalize">
                        {item.detectedCategory.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-100 dark:border-[#245C3A]/20">
                      <span className="text-stone-500 dark:text-[#a0b5a3]">Target Parts:</span>
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {item.affectedPlantParts.join(', ')}
                      </span>
                    </div>

                    <div className="mt-2 p-2.5 rounded-lg bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3" /> Economic Threshold (ETL):
                      </p>
                      <p className="text-[11px] text-stone-600 dark:text-[#CFDEC9]">
                        {item.economicThresholdLevelETL}
                      </p>
                    </div>

                    {item.symptomsDescription && (
                      <p className="text-[11px] text-stone-600 dark:text-[#a0b5a3] italic pt-1">
                        "{item.symptomsDescription}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400">Status Action:</span>
                    <div className="flex items-center gap-1">
                      {item.status !== 'resolved' ? (
                        <>
                          {item.status === 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(item._id, 'under_treatment')}
                              disabled={updatingId === item._id}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors"
                            >
                              Spray Started
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(item._id, 'resolved')}
                            disabled={updatingId === item._id}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                          >
                            Mark Resolved
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'active')}
                          disabled={updatingId === item._id}
                          className="px-2 py-1 rounded text-[10px] font-semibold bg-stone-100 dark:bg-[#193D2A] text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-200 transition-colors"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/crop-protection?detectionId=${item._id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 hover:bg-[#CFDEC9] dark:hover:bg-[#245C3A] transition-colors"
                  >
                    Generate IPM Advisory <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Diagnosis Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#245C3A]/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white">
                  <Bug className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">New Pest & Disease Diagnostic Log</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    ICAR taxonomy & ETL threshold analysis
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

            {/* Quick Presets */}
            <div className="my-4 p-3 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-[#a0b5a3] block mb-2">
                ⚡ Quick ICAR Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PEST_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-white dark:bg-[#193D2A] border border-[#E3E8DF] dark:border-[#245C3A]/40 hover:border-[#245C3A] text-stone-800 dark:text-[#CFDEC9] transition-all"
                  >
                    {p.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Farm Parcel *
                  </label>
                  <select
                    value={formData.farmId}
                    onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="">Select a farm parcel</option>
                    {farms.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.parcelName} ({f.farmerId?.name || 'Farmer'})
                      </option>
                    ))}
                  </select>
                </div>

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
                    Pest / Disease Name *
                  </label>
                  <input
                    type="text"
                    value={formData.pestDiseaseName}
                    onChange={(e) => setFormData({ ...formData, pestDiseaseName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Scientific / Binomial Name
                  </label>
                  <input
                    type="text"
                    value={formData.scientificName}
                    onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Diagnostic Category
                  </label>
                  <select
                    value={formData.detectedCategory}
                    onChange={(e) => setFormData({ ...formData, detectedCategory: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="insect_pest">Insect Pest</option>
                    <option value="fungal_disease">Fungal Disease / Blight</option>
                    <option value="bacterial_disease">Bacterial Infection</option>
                    <option value="viral_disease">Viral Disease</option>
                    <option value="nutrient_deficiency">Nutrient Deficiency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Severity Rating
                  </label>
                  <select
                    value={formData.severityLevel}
                    onChange={(e) => setFormData({ ...formData, severityLevel: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="mild">Mild (Localized symptoms)</option>
                    <option value="moderate">Moderate (Approaching ETL)</option>
                    <option value="critical">Critical (Exceeded ETL, Immediate Spray)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    AI Confidence Score (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.confidenceScorePercent}
                    onChange={(e) => setFormData({ ...formData, confidenceScorePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Affected Plant Parts
                  </label>
                  <input
                    type="text"
                    value={formData.affectedPlantParts}
                    onChange={(e) => setFormData({ ...formData, affectedPlantParts: e.target.value })}
                    placeholder="e.g. leaf, stem, panicle"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Economic Threshold Level (ETL) Definition *
                </label>
                <input
                  type="text"
                  value={formData.economicThresholdLevelETL}
                  onChange={(e) => setFormData({ ...formData, economicThresholdLevelETL: e.target.value })}
                  required
                  placeholder="e.g. 5-10 hoppers per hill"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Symptoms Description & Visual Markers
                </label>
                <textarea
                  rows={2}
                  value={formData.symptomsDescription}
                  onChange={(e) => setFormData({ ...formData, symptomsDescription: e.target.value })}
                  placeholder="Describe lesions, discoloration, frass, or insect cluster patterns..."
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
                  Save Diagnostic Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
