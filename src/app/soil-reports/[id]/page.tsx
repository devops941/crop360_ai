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
        <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
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
