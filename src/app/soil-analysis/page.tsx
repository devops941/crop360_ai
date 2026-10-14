'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AnalysisItem {
  _id: string;
  reportId: { _id: string; sampleCode: string; testDate: string };
  farmerId: { _id: string; name: string; farmerCode: string; district: string; state: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres: number; soilType: string };
  overallHealthScore: number;
  fertilityRating: 'poor' | 'moderate' | 'good' | 'exceptional';
  soilPhCategory: string;
  remediationSummary: string;
  nutrients: Array<{
    parameter: string;
    value: number;
    unit: string;
    benchmarkRange: string;
    rating: string;
    deviationPercentage: number;
  }>;
  actionPlan: Array<{
    category: string;
    action: string;
    recommendation: string;
    dosagePerAcre: string;
    timing: string;
    priority: 'immediate' | 'recommended' | 'optional';
  }>;
  vernacularSummary: {
    en: string;
    ta?: string;
    hi?: string;
  };
  recommendedNextSampleMonth: string;
  createdAt: string;
}

export default function SoilAnalysisPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [issuingCard, setIssuingCard] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/soil-analysis');
        const json = await res.json();
        if (json.success && json.data) {
          setAnalyses(json.data);
          if (json.data.length > 0) setSelectedId(json.data[0]._id);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeItem = analyses.find((a) => a._id === selectedId) || analyses[0];

  const handleIssueHealthCard = async () => {
    if (!activeItem) return;
    try {
      setIssuingCard(true);
      const res = await fetch('/api/soil-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: activeItem.reportId._id }),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/soil-cards');
      } else {
        alert(json.message || 'Failed to issue card');
      }
    } catch {
      alert('Network error issuing card');
    } finally {
      setIssuingCard(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-950/30';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/30';
    return 'text-red-600 dark:text-red-400 border-red-500 bg-red-50 dark:bg-red-950/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
              Module 4
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
              AI Soil Health & Nutrient Analysis
            </h1>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Automated ICAR agronomic benchmark comparisons, deficiency detection, and vernacular remediation advisories.
          </p>
        </div>

        <Link
          href="/soil-reports"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          <Layers className="w-4 h-4" />
          View All Soil Reports
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-stone-500">Running AI Soil Diagnostics...</div>
      ) : analyses.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/20">
          <Sparkles className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">No Soil Analyses Available</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            Upload a soil test report in Module 3 and click “Run AI Analysis” to generate diagnostic insights.
          </p>
          <Link
            href="/soil-reports/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] text-white text-sm font-semibold shadow"
          >
            Upload Soil Test Report
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Sample Selector list */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Analyzed Parcels ({analyses.length})
            </h3>
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {analyses.map((item) => {
                const isSelected = item._id === (activeItem?._id || '');
                return (
                  <button
                    key={item._id}
                    onClick={() => setSelectedId(item._id)}
                    className={`w-full text-left p-4 rounded-xl border transition ${
                      isSelected
                        ? 'bg-white dark:bg-[#1a231d] border-[#245C3A] shadow-md ring-1 ring-[#245C3A]'
                        : 'bg-white/60 dark:bg-[#1a231d]/60 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-[#245C3A]">
                        {item.reportId?.sampleCode}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreColor(
                          item.overallHealthScore
                        )}`}
                      >
                        {item.overallHealthScore}/100
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                      {item.farmerId?.name}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {item.farmId?.parcelName} ({item.farmId?.soilType})
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Deep Dive */}
          {activeItem && (
            <div className="lg:col-span-8 space-y-6">
              {/* Score Hero Banner */}
              <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <span className="text-xs font-mono text-[#245C3A] font-semibold">
                      Sample: {activeItem.reportId?.sampleCode} • Tested {new Date(activeItem.reportId?.testDate).toLocaleDateString()}
                    </span>
                    <h2 className="text-2xl font-bold text-[#193D2A] dark:text-[#E8F0E9] mt-1">
                      {activeItem.farmerId?.name} — {activeItem.farmId?.parcelName}
                    </h2>
                    <p className="text-sm text-stone-500">
                      Survey No: {activeItem.farmId?.surveyNumber} • {activeItem.farmId?.totalAreaAcres} Acres ({activeItem.farmId?.soilType})
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center justify-center p-4 rounded-2xl border border-[#245C3A]/20 bg-[#245C3A]/5 min-w-[130px]">
                    <span className="text-xs uppercase tracking-wider text-stone-500 font-bold">Health Score</span>
                    <span className="text-3xl font-extrabold text-[#193D2A] dark:text-[#E8F0E9] mt-1">
                      {activeItem.overallHealthScore}
                      <span className="text-base text-stone-400 font-normal">/100</span>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#245C3A] mt-0.5">
                      {activeItem.fertilityRating}
                    </span>
                  </div>
                </div>

                {/* Multilingual / Vernacular Summary */}
                <div className="mt-6 p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI Vernacular Agronomy Advisory
                  </span>
                  <p className="text-sm text-stone-800 dark:text-stone-200 font-medium">
                    {activeItem.vernacularSummary?.en}
                  </p>
                  {activeItem.vernacularSummary?.ta && (
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      <span className="font-semibold text-[#245C3A]">தமிழ்:</span> {activeItem.vernacularSummary.ta}
                    </p>
                  )}
                  {activeItem.vernacularSummary?.hi && (
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      <span className="font-semibold text-[#245C3A]">हिंदी:</span> {activeItem.vernacularSummary.hi}
                    </p>
                  )}
                </div>

                {/* Next Soil Sample Recommendation */}
                <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Recommended Resampling: <strong>{activeItem.recommendedNextSampleMonth}</strong>
                  </span>
                  <button
                    onClick={handleIssueHealthCard}
                    disabled={issuingCard}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-sm"
                  >
                    <Award className="w-3.5 h-3.5" />
                    {issuingCard ? 'Generating Card...' : 'Issue Soil Health Card →'}
                  </button>
                </div>
              </div>

              {/* Chemical Nutrient Rating Table */}
              <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9] mb-4">
                  Nutrient Benchmark Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 text-xs text-left">
                        <th className="pb-3 font-semibold">Parameter</th>
                        <th className="pb-3 font-semibold">Field Value</th>
                        <th className="pb-3 font-semibold">ICAR Standard</th>
                        <th className="pb-3 font-semibold">Agronomic Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {activeItem.nutrients.map((n, idx) => {
                        const isOk = n.rating === 'optimal' || n.rating === 'medium';
                        return (
                          <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/50">
                            <td className="py-3 font-medium text-stone-800 dark:text-stone-200">
                              {n.parameter}
                            </td>
                            <td className="py-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                              {n.value} {n.unit}
                            </td>
                            <td className="py-3 text-stone-500 text-xs font-mono">
                              {n.benchmarkRange}
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                  isOk
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200'
                                }`}
                              >
                                {isOk ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {n.rating}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actionable Remediation Prescriptions */}
              <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-[#193D2A] dark:text-[#E8F0E9]">
                  Field Remediation & Fertilizer Schedule ({activeItem.actionPlan.length})
                </h3>
                <div className="space-y-3">
                  {activeItem.actionPlan.map((plan, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#193D2A] dark:text-[#E8F0E9]">
                          {idx + 1}. {plan.action}
                        </span>
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            plan.priority === 'immediate'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {plan.priority}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300">
                        {plan.recommendation}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-500 pt-1 border-t border-stone-200 dark:border-stone-800">
                        <span>
                          <strong>Dosage:</strong> {plan.dosagePerAcre}
                        </span>
                        <span>
                          <strong>Application Timing:</strong> {plan.timing}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    href={`/crop-suitability?soilReportId=${activeItem.reportId._id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow transition"
                  >
                    Proceed to Crop Suitability Engine (Module 6)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
