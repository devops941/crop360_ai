'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative py-12 md:py-20 bg-[#FAFAF6] border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Authentic Brand Messaging */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <p className="text-xs font-semibold tracking-wider text-[#245C3A] uppercase mb-4">
              Intelligence for Indian Agriculture
            </p>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#252B26] leading-[1.2] tracking-tight">
              Better Farming Starts with Better Decisions.
            </h1>

            {/* Supporting Description */}
            <p className="mt-4 text-base text-[#687168] leading-relaxed max-w-xl">
              Understand your soil, choose suitable crops, and plan every stage of cultivation with
              practical, data-informed agricultural guidance.
            </p>

            {/* Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#soil-report"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors"
              >
                <span>Explore Crop360 AI</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium rounded-lg border border-[#E3E8DF] bg-white hover:bg-[#F1F5EE] text-[#252B26] transition-colors"
              >
                <span>How It Works</span>
              </a>
            </div>

            {/* Sub-line below buttons */}
            <p className="mt-5 text-xs text-[#687168]">From soil analysis to harvest planning.</p>
          </div>

          {/* Right Column: Clean, Authentic Indian Farmer Photograph - NO Overlays */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-[#E3E8DF] bg-white shadow-xs">
              <Image
                src="/images/hero_farmer_field.jpg"
                alt="Indian farmer standing in a green crop field during daylight"
                width={600}
                height={460}
                priority
                className="w-full h-[340px] sm:h-[400px] object-cover object-center"
              />
            </div>
            <p className="mt-2 text-[11px] text-[#687168] text-center">
              Field agronomy designed for Indian agro-climatic conditions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
