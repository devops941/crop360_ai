'use client';

import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-14 sm:py-20 bg-[#193D2A] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-wider text-[#CFDEC9] mb-3">
            Start Your Cultivation Plan
          </p>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Your Next Harvest Starts with a Better Decision.
          </h2>

          {/* Supporting Text */}
          <p className="mt-4 text-sm sm:text-base text-[#CFDEC9] leading-relaxed">
            Bring your soil test data together and explore smarter ways to plan your next growing
            season—with scientific crop selection, balanced fertilizer planning, and structured
            lifecycle guidance.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#soil-report"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-lg bg-white hover:bg-[#F1F5EE] text-[#193D2A] transition-colors"
            >
              <span>Explore Sample Report</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#193D2A]" />
            </a>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-lg border border-[#4F8558] hover:border-white text-white transition-colors"
            >
              <span>How It Works</span>
            </a>
          </div>

          {/* Trust bullets */}
          <div className="mt-10 pt-6 border-t border-[#245C3A] flex flex-wrap items-center justify-center gap-6 text-xs text-[#CFDEC9]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4F8558]" />
              <span>Sample data available instantly</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4F8558]" />
              <span>Soil Health Card format compatible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4F8558]" />
              <span>Free for Indian farming communities</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
