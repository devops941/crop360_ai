'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Info, X } from 'lucide-react';

export function SoilReportPreview() {
  const [modalOpen, setModalOpen] = useState(false);

  const sampleParameters = [
    {
      name: 'Soil pH',
      value: '6.8',
      unit: '',
      status: 'Neutral & Optimal',
      benchmark: '6.5 - 7.5',
    },
    {
      name: 'Available Nitrogen (N)',
      value: '240',
      unit: 'kg/ha',
      status: 'Low',
      benchmark: '280 - 560 kg/ha',
    },
    {
      name: 'Available Phosphorus (P)',
      value: '18',
      unit: 'kg/ha',
      status: 'Medium',
      benchmark: '10 - 25 kg/ha',
    },
    {
      name: 'Available Potassium (K)',
      value: '295',
      unit: 'kg/ha',
      status: 'High',
      benchmark: '108 - 280 kg/ha',
    },
    {
      name: 'Organic Carbon (OC)',
      value: '0.65',
      unit: '%',
      status: 'Medium',
      benchmark: '> 0.75%',
    },
    {
      name: 'Electrical Conductivity (EC)',
      value: '0.42',
      unit: 'dS/m',
      status: 'Normal Non-Saline',
      benchmark: '< 1.0 dS/m',
    },
  ];

  return (
    <section id="soil-report" className="py-14 md:py-20 bg-white border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#245C3A] mb-2">
            Soil Health Card Preview
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252B26] tracking-tight">
            Understand Your Soil Report
          </h2>
          <p className="mt-3 text-sm text-[#687168] leading-relaxed">
            See how standard laboratory figures are translated into clear, actionable
            recommendations.
          </p>
        </div>

        {/* 2-Column Clean Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Illustrative Soil Health Card */}
          <div className="lg:col-span-7 rounded-xl border border-[#E3E8DF] bg-[#FAFAF6] overflow-hidden">
            {/* Card Header with Sample Label */}
            <div className="p-5 border-b border-[#E3E8DF] flex flex-wrap items-center justify-between gap-3 bg-white">
              <div>
                <h3 className="text-sm font-semibold text-[#252B26]">
                  Sample Soil Test Card &bull; Ref #SHC-4092
                </h3>
                <p className="text-xs text-[#687168] mt-0.5">
                  Soil Classification: Clayey Loam &bull; State: Tamil Nadu / Maharashtra
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#F1F5EE] text-[#245C3A] border border-[#CFDEC9]">
                Illustrative Sample Data
              </span>
            </div>

            {/* Parameter Rows */}
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sampleParameters.map((param, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-[#E3E8DF] bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-[#252B26]">{param.name}</span>
                        <span className="text-[11px] text-[#245C3A] font-semibold">
                          {param.status}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-[#252B26] font-mono">
                        {param.value}{' '}
                        <span className="text-xs font-normal text-[#687168]">{param.unit}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#F1F5EE] text-[11px] text-[#687168]">
                      Ideal range: {param.benchmark}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample Disclaimer Notice */}
              <div className="mt-4 p-3 rounded-lg bg-white border border-[#E3E8DF] flex items-start gap-2.5 text-xs text-[#687168]">
                <Info className="h-4 w-4 text-[#245C3A] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Sample Notice:</strong> Values above represent a standard testing
                  template. When you upload your actual soil test report, recommendations are
                  calculated specifically from your soil measurements.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Explanatory "Understand Your Soil Better" Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="overflow-hidden rounded-xl border border-[#E3E8DF] bg-white h-48 sm:h-52 relative">
              <Image
                src="/images/soil_testing_field.jpg"
                alt="Farmer and agronomist holding fertile dark soil in crop field"
                fill
                className="object-cover"
              />
            </div>

            <div className="rounded-xl border border-[#E3E8DF] bg-[#FAFAF6] p-6">
              <h3 className="text-sm font-semibold text-[#245C3A] uppercase tracking-wider mb-2">
                Understand Your Soil Better
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-[#252B26] leading-relaxed">
                <p>
                  <strong>Nitrogen Management:</strong> A reading of 240 kg/ha indicates lower
                  vegetative energy. We recommend splitting urea applications into 3 smaller doses
                  to minimize vapor loss.
                </p>
                <p>
                  <strong>Potassium Surplus:</strong> At 295 kg/ha, potassium levels are sufficient.
                  You can reduce expenditure on MOP (Potash) fertilizer this season.
                </p>
                <p>
                  <strong>Balanced pH:</strong> A pH of 6.8 is neutral, providing optimal root
                  nutrient availability without needing lime or gypsum amendments.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E3E8DF]">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-medium transition-colors"
                >
                  <span>Explore Soil Analysis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-w-md w-full rounded-xl bg-white border border-[#E3E8DF] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8DF]">
              <h3 className="text-base font-semibold text-[#252B26]">Soil Analysis Module</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-[#687168] hover:text-[#252B26]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="py-4 text-xs sm:text-sm text-[#252B26] space-y-3 leading-relaxed">
              <p>
                Soil report upload and OCR digitization will launch in <strong>Phase 2</strong>.
              </p>
              <div className="p-3 rounded-lg bg-[#FAFAF6] border border-[#E3E8DF] text-xs text-[#687168] space-y-1.5">
                <div className="font-semibold text-[#245C3A]">Upcoming Capabilities:</div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Soil Health Card (SHC) image &amp; PDF ingestion</li>
                  <li>District-specific N-P-K balancing formula</li>
                  <li>Organic manure &amp; amendment guidance</li>
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full py-2 rounded-lg bg-[#245C3A] text-white text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
