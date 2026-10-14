'use client';

import React from 'react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Upload Soil Test Report',
      description: 'Enter values from your Soil Health Card or laboratory test report.',
    },
    {
      number: '2',
      title: 'Understand Soil Conditions',
      description:
        'Review a clear explanation of pH, primary nutrients (N-P-K), and organic carbon.',
    },
    {
      number: '3',
      title: 'Explore Suitable Crops',
      description: 'See which crops match your soil profile, water availability, and local season.',
    },
    {
      number: '4',
      title: 'Generate Cultivation Plan',
      description: 'Follow stage-by-stage advisories from land preparation to vegetative growth.',
    },
    {
      number: '5',
      title: 'Plan Harvesting and Selling',
      description:
        'Check maturity indicators, storage moisture limits, and regional market trends.',
    },
  ];

  return (
    <section id="how-it-works" className="py-14 md:py-20 bg-white border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#245C3A] mb-2">
            The Process
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252B26] tracking-tight">
            How Crop360 AI Works
          </h2>
          <p className="mt-3 text-sm text-[#687168] leading-relaxed">
            A practical five-step workflow designed to simplify complex agronomic decisions.
          </p>
        </div>

        {/* Desktop: Clean 5-Step Horizontal Sequence */}
        <div className="hidden lg:grid grid-cols-5 gap-4 relative">
          {/* Subtle connecting line */}
          <div className="absolute top-5 left-10 right-10 h-px bg-[#E3E8DF] z-0" />

          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAF6] border border-[#E3E8DF] text-xs font-semibold text-[#245C3A] mb-4">
                {step.number}
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#252B26] mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs text-[#687168] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Mobile: Vertical Timeline */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E7EFE6] text-xs font-bold text-[#245C3A] flex-shrink-0">
                {step.number}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#252B26]">{step.title}</h3>
                <p className="text-xs text-[#687168] mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
