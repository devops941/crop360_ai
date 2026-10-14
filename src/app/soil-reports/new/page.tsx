import React from 'react';
import { SoilReportForm } from '@/components/modules/soil-report-form';

export default function NewSoilReportPage() {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-[#245C3A]/10">
        <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
          Module 3 — Upload
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9] mt-1">
          Upload Soil Test Report
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Enter laboratory test values across 12 parameters to prepare this sample for AI analysis.
        </p>
      </div>

      <SoilReportForm mode="create" />
    </div>
  );
}
