'use client';

import React from 'react';
import { Compass, CalendarCheck, PiggyBank, FolderArchive, CheckCircle2 } from 'lucide-react';

export function BenefitsSection() {
  const benefits = [
    {
      icon: Compass,
      title: 'Better-Informed Crop Decisions',
      desc: 'Base your sowing choices on verified laboratory soil properties, local rainfall patterns, and groundwater conditions instead of guesswork or hearsay.',
      practicalNote: 'Verified agronomic facts before investing in high-cost seed varieties.',
    },
    {
      icon: CalendarCheck,
      title: 'Organized Cultivation Planning',
      desc: 'Follow a structured roadmap from land prep to harvest. Know exactly when basal fertilizers, weeding, and critical irrigations are due.',
      practicalNote: 'Reduces operational confusion and prevents missing critical growth windows.',
    },
    {
      icon: PiggyBank,
      title: 'Targeted Fertilizer Expenditure',
      desc: 'Curtail unnecessary expenditure on excess urea or blanket chemical sprays by applying only what your specific soil sample actually requires.',
      practicalNote: 'Helps prevent over-application and economizes input costs by 15–25%.',
    },
    {
      icon: FolderArchive,
      title: 'Connected Seasonal Farm Records',
      desc: 'Maintain a single digital history of soil tests, inputs applied, yields harvested, and seasonal expenses across your different survey land parcels.',
      practicalNote: 'Valuable documentation for crop insurance, credit, and FPO aggregation.',
    },
  ];

  return (
    <section className="py-14 md:py-20 bg-white border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#245C3A] mb-2">
            Practical Value
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252B26] tracking-tight">
            Realistic Benefits for Indian Farming Families
          </h2>
          <p className="mt-3 text-sm text-[#687168] leading-relaxed">
            We don&apos;t make exaggerated promises of magical yields. Instead, we provide grounded,
            scientific decision support that helps you manage input costs, reduce risk, and plan
            each season systematically.
          </p>
        </div>

        {/* Benefits 4-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-[#E3E8DF] bg-[#FAFAF6] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-[#E7EFE6] text-[#245C3A] flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#252B26]">{item.title}</h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#687168] leading-relaxed">{item.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E3E8DF] flex items-center gap-2 text-xs font-medium text-[#245C3A]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#245C3A]" />
                  <span>{item.practicalNote}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible Agronomy Commitment Box */}
        <div className="mt-10 p-4 rounded-xl border border-[#E3E8DF] bg-[#F1F5EE] text-center max-w-2xl mx-auto">
          <p className="text-xs text-[#687168] leading-relaxed">
            <strong className="text-[#252B26]">Our Commitment to Farmers:</strong> Crop360 AI
            provides advisory decision guidance based on verified soil testing methods and ICAR
            package of practices. Final farming outcomes depend on weather conditions, market
            prices, and sound agronomic field execution.
          </p>
        </div>
      </div>
    </section>
  );
}
