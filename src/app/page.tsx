import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { HeroSection } from '@/components/home/hero-section';
import { ProblemSolutionSection } from '@/components/home/problem-solution-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { FeaturesSection } from '@/components/home/features-section';
import { CropLifecycleSection } from '@/components/home/crop-lifecycle-section';
import { SoilReportPreview } from '@/components/home/soil-report-preview';
import { IndianCropsSection } from '@/components/home/indian-crops-section';
import { BenefitsSection } from '@/components/home/benefits-section';
import { LanguageSection } from '@/components/home/language-section';
import { CTASection } from '@/components/home/cta-section';
import { StatusIndicator } from '@/components/common/status-indicator';
import { Footer } from '@/components/layout/footer';
import { Activity } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF6] text-[#252B26]">
      {/* 1. Header Navigation */}
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section with Authentic Farmer Photograph */}
        <HeroSection />

        {/* 3. Problem and Solution */}
        <ProblemSolutionSection />

        {/* 4. How Crop360 AI Works (5 Steps) */}
        <HowItWorksSection />

        {/* 5. Core Capabilities (3 Pillars) */}
        <FeaturesSection />

        {/* 6. Complete 9-Stage Crop Lifecycle */}
        <CropLifecycleSection />

        {/* 7. Soil Report Preview (Illustrative Sample Data) */}
        <SoilReportPreview />

        {/* 8. Built for Indian Agriculture (6 Major Crops) */}
        <IndianCropsSection />

        {/* 9. Benefits for Farmers */}
        <BenefitsSection />

        {/* 10. Language & Accessibility (EN / TA / HI) */}
        <LanguageSection />

        {/* 11. Call-to-Action Banner */}
        <CTASection />

        {/* Live Backend & MongoDB Atlas Connectivity Monitor */}
        <section className="py-12 bg-[#FAFAF6] border-t border-[#E3E8DF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#245C3A]" />
                <h3 className="text-xs font-semibold text-[#252B26] uppercase tracking-wider">
                  Live System &amp; Database Health
                </h3>
              </div>
              <span className="text-xs text-[#687168] font-mono">MongoDB Atlas Connected</span>
            </div>
            <StatusIndicator />
          </div>
        </section>
      </main>

      {/* 12. Footer with Agronomic Disclaimer */}
      <Footer />
    </div>
  );
}
