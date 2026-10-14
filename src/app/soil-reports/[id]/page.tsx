import React from 'react';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import { soilReportRepository } from '@/repositories/soil-report.repository';
import { SoilReportForm } from '@/components/modules/soil-report-form';

interface EditSoilReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSoilReportPage({ params }: EditSoilReportPageProps) {
  await connectDB();
  const { id } = await params;
  const report = await soilReportRepository.findById(id);

  if (!report) {
    notFound();
  }

  const plainReport = JSON.parse(JSON.stringify(report));

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-[#245C3A]/10">
        <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
          Module 3 — Edit
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9] mt-1">
          Edit Soil Test Report — {plainReport.sampleCode}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Update laboratory observations, nutrient parameters, or parcel mapping.
        </p>
      </div>

      <SoilReportForm initialData={plainReport} mode="edit" />
    </div>
  );
}
