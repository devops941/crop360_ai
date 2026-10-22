'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, FlaskConical, Sparkles, Award } from 'lucide-react';
import { DataTable, Column } from '@/components/common/data-table';
import { useRouter } from 'next/navigation';

interface SoilReportRow extends Record<string, unknown> {
  _id: string;
  sampleCode: string;
  testDate: string;
  testingLabName: string;
  farmerId?: { _id: string; name: string; farmerCode: string; district: string };
  farmId?: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres: number };
  status: 'pending' | 'analyzed' | 'card_generated' | 'rejected';
  parameters: {
    pH: number;
    electricalConductivity: number;
    organicCarbon: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
}

export default function SoilReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SoilReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/soil-reports');
      const json = await res.json();
      if (json.success) {
        setReports(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRunAiAnalysis = async (reportId: string) => {
    try {
      setAnalyzingId(reportId);
      const res = await fetch(`/api/soil-reports/${reportId}/analyze`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        // Also auto-generate the Soil Health Card so both modules are ready!
        await fetch('/api/soil-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId }),
        }).catch(() => null);

        router.push('/soil-analysis');
      } else {
        alert(json.message || 'Analysis failed');
      }
    } catch {
      alert('Analysis request failed');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleGenerateCard = async (reportId: string) => {
    try {
      setGeneratingCardId(reportId);
      const res = await fetch('/api/soil-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/soil-cards');
      } else {
        alert(json.message || 'Card generation failed');
      }
    } catch {
      alert('Failed to generate Soil Health Card');
    } finally {
      setGeneratingCardId(null);
    }
  };

  const columns: Column<SoilReportRow>[] = [
    {
      key: 'sampleCode',
      header: 'Sample Code',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-[#193D2A] dark:text-[#E8F0E9] block">
            {r.sampleCode}
          </span>
          <span className="text-xs text-stone-500">
            {new Date(r.testDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'farmerName',
      header: 'Farmer & Land Parcel',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-semibold text-stone-800 dark:text-stone-200 block">
            {r.farmerId?.name || 'Unknown Farmer'}
          </span>
          <span className="text-xs text-stone-500">
            {r.farmId?.parcelName} (Survey #{r.farmId?.surveyNumber}) — {r.farmerId?.district}
          </span>
        </div>
      ),
    },
    {
      key: 'profile',
      header: 'Primary Chemical Profile',
      render: (r) => (
        <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            pH {r.parameters?.pH}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            EC {r.parameters?.electricalConductivity}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            OC {r.parameters?.organicCarbon}%
          </span>
          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            NPK {r.parameters?.nitrogen}/{r.parameters?.phosphorus}/{r.parameters?.potassium}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Workflow Status',
      sortable: true,
      render: (r) => {
        const badgeStyles: Record<string, string> = {
          pending: 'bg-stone-100 dark:bg-stone-800 text-stone-600 border-stone-200',
          analyzed: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 border-blue-300',
          card_generated: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-300',
          rejected: 'bg-red-50 dark:bg-red-950/40 text-red-700 border-red-300',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
              badgeStyles[r.status] || badgeStyles.pending
            }`}
          >
            {r.status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Intelligence Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.status === 'pending' && (
            <button
              onClick={() => handleRunAiAnalysis(r._id)}
              disabled={analyzingId === r._id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {analyzingId === r._id ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
          )}
          {r.status === 'analyzed' && (
            <div className="flex items-center gap-2">
              <Link
                href="/soil-analysis"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 text-xs font-medium hover:bg-blue-100"
              >
                <Sparkles className="w-3.5 h-3.5" />
                View Analysis
              </Link>
              <button
                onClick={() => handleGenerateCard(r._id)}
                disabled={generatingCardId === r._id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                {generatingCardId === r._id ? 'Issuing...' : 'Issue Card'}
              </button>
            </div>
          )}
          {r.status === 'card_generated' && (
            <div className="flex items-center gap-2">
              <Link
                href="/soil-analysis"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#245C3A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Analysis
              </Link>
              <Link
                href="/soil-cards"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
              >
                <Award className="w-3.5 h-3.5" />
                Soil Card →
              </Link>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9] mb-1">
            Soil Test Report Upload & Registry
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Digitize laboratory test reports with 12 Soil Health Card parameters, run AI agronomy diagnostics, and issue Soil Health Cards.
          </p>
        </div>

        <Link
          href="/soil-reports/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Upload New Test Report
        </Link>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#1a231d] border border-[#245C3A]/10">
          <span className="text-xs text-stone-500 font-medium">Total Samples Digitized</span>
          <p className="text-2xl font-bold text-[#193D2A] dark:text-[#E8F0E9] mt-1">{reports.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#1a231d] border border-[#245C3A]/10">
          <span className="text-xs text-stone-500 font-medium">Pending AI Diagnosis</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {reports.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#1a231d] border border-[#245C3A]/10">
          <span className="text-xs text-stone-500 font-medium">AI Analyzed Samples</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {reports.filter((r) => r.status === 'analyzed').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#1a231d] border border-[#245C3A]/10">
          <span className="text-xs text-stone-500 font-medium">Official Cards Issued</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {reports.filter((r) => r.status === 'card_generated').length}
          </p>
        </div>
      </div>

      {/* Reports Data Table */}
      {loading ? (
        <div className="p-8 text-center text-stone-500 bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/10">
          Loading soil test reports...
        </div>
      ) : (
        <DataTable<SoilReportRow>
          data={reports}
          columns={columns}
          searchKey="sampleCode"
          searchPlaceholder="Search by sample code..."
          emptyMessage="No soil test reports registered yet. Upload your first laboratory report to trigger AI soil health recommendations."
        />
      )}
    </div>
  );
}
