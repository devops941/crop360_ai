'use client';

import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function ProblemSolutionSection() {
  const challenges = [
    {
      title: 'Interpreting Soil Test Reports',
      desc: 'Laboratory reports often present chemical figures without clear explanations of what inputs or amendments are actually needed.',
    },
    {
      title: 'Selecting Crops for Local Conditions',
      desc: 'Choosing what to sow based on hearsay or previous years, without accounting for current soil nutrient reserves or seasonal water availability.',
    },
    {
      title: 'Planning Nutrient and Water Requirements',
      desc: 'Over-applying or under-applying fertilizers, which wastes money and can degrade soil structure over time.',
    },
    {
      title: 'Preparing for Harvest and Market Changes',
      desc: 'Harvesting without moisture awareness or facing volatile market rates at local mandis with limited price information.',
    },
  ];

  const solutions = [
    {
      title: 'Plain-Language Soil Explanation',
      desc: 'Clear interpretations of your soil test numbers, with specific organic matter and nutrient adjustment guidance.',
    },
    {
      title: 'Data-Informed Crop Matching',
      desc: 'Recommendations that match crops to your specific soil characteristics, agro-climatic zone, and available irrigation.',
    },
    {
      title: 'Stage-by-Stage Advisory',
      desc: 'Timely reminders for basal fertilizer application, weeding windows, and critical moisture periods throughout the season.',
    },
    {
      title: 'Harvest & Market Readiness',
      desc: 'Guidance on optimal harvest maturity, grain moisture thresholds, and price information from regional markets.',
    },
  ];

  return (
    <section className="py-14 md:py-20 bg-[#F1F5EE] border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#245C3A] mb-2">
            The Decision Gap
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252B26] tracking-tight">
            Every Farming Decision Matters
          </h2>
          <p className="mt-3 text-sm text-[#687168] leading-relaxed">
            Agricultural outcomes depend on connected decisions made weeks and months apart.
          </p>
        </div>

        {/* Clean Editorial 2-Column Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Column: Challenges Farmers Face */}
          <div className="rounded-xl border border-[#E3E8DF] bg-white p-7 flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-[#E3E8DF]">
                <h3 className="text-base font-semibold text-[#252B26]">Challenges Farmers Face</h3>
                <p className="text-xs text-[#687168] mt-1">
                  Common friction points across the cropping season
                </p>
              </div>

              <div className="mt-6 space-y-5">
                {challenges.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#687168] flex-shrink-0" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#252B26]">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#687168] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E3E8DF] text-xs text-[#687168]">
              Unconnected decisions frequently increase costs and introduce preventable risks.
            </div>
          </div>

          {/* Right Column: How Crop360 AI Helps */}
          <div className="rounded-xl border border-[#CFDEC9] bg-[#FAFAF6] p-7 flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-[#CFDEC9]">
                <h3 className="text-base font-semibold text-[#245C3A]">How Crop360 AI Helps</h3>
                <p className="text-xs text-[#687168] mt-1">
                  Connecting farm information into actionable season planning
                </p>
              </div>

              <div className="mt-6 space-y-5">
                {solutions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#245C3A] flex-shrink-0" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#252B26]">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#687168] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#CFDEC9] flex items-center justify-between text-xs">
              <span className="text-[#245C3A] font-medium">
                Integrated guidance from soil test to harvest
              </span>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1 font-medium text-[#245C3A] hover:underline"
              >
                <span>See workflow</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
