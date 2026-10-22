import React from 'react';
import { SoilReportForm } from '@/components/modules/soil-report-form';

export default function NewSoilReportPage() {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-[#245C3A]/10">
        <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
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
