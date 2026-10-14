'use client';

import React from 'react';
import { FlaskConical, CalendarDays, LineChart } from 'lucide-react';

export function FeaturesSection() {
  const capabilities = [
    {
      icon: FlaskConical,
      title: 'Soil-Based Crop Planning',
      description:
        'Translate soil chemical properties—including pH, nitrogen, phosphorus, potassium, and organic carbon—into practical crop suitability and fertilizer recommendations.',
    },
    {
      icon: CalendarDays,
      title: 'Complete Crop Lifecycle',
      description:
        'A continuous cultivation roadmap that guides critical farm activities across seed treatment, basal application, vegetative weeding, and moisture stages.',
    },
    {
      icon: LineChart,
      title: 'Harvest and Market Planning',
      description:
        'Identify physiological maturity indicators, safe storage moisture standards, and local market price trends to make well-timed selling decisions.',
    },
  ];

  return (
    <section id="features" className="py-14 md:py-20 bg-[#FAFAF6] border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#245C3A] mb-2">
            Core Capabilities
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252B26] tracking-tight">
            Everything Your Crop Needs, in One Place
          </h2>
          <p className="mt-3 text-sm text-[#687168] leading-relaxed">
            Connected decision tools built to remove the guesswork from every stage of the growing
            season.
          </p>
        </div>

        {/* Clean 3-Column Editorial Grid with subtle borders and generous whitespace */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-start p-6 rounded-xl border border-[#E3E8DF] bg-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7EFE6] text-[#245C3A] mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[#252B26]">{item.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#687168] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
