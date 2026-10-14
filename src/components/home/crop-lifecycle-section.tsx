'use client';

import React, { useState } from 'react';
import {
  Tractor,
  Sparkles,
  Shovel,
  Leaf,
  Droplets,
  Eye,
  Wheat,
  Warehouse,
  IndianRupee,
  Check,
} from 'lucide-react';

export function CropLifecycleSection() {
  const [activeStage, setActiveStage] = useState(2); // Sowing by default

  const stages = [
    {
      step: 1,
      name: 'Land Preparation',
      icon: Tractor,
      timing: '15-20 Days Prior to Sowing',
      advisory:
        'Deep summer ploughing followed by rotavator tilling to expose soil pathogens and break hard subsoil pans.',
      checklist: [
        'Apply 5-8 tons/acre well-decomposed FYM or compost',
        'Incorporate agricultural lime or gypsum based on soil pH test',
        'Level the field to ensure uniform irrigation and drainage',
      ],
    },
    {
      step: 2,
      name: 'Seed Selection',
      icon: Sparkles,
      timing: '7-10 Days Prior to Sowing',
      advisory:
        'Certified high-germination seed sourcing matched to local rainfall duration and pest history.',
      checklist: [
        'Select certified seeds from authorized agricultural cooperatives',
        'Verify germination percentage (minimum 85% recommended)',
        'Choose duration cycle matching local water availability',
      ],
    },
    {
      step: 3,
      name: 'Sowing & Treatment',
      icon: Shovel,
      timing: 'Day 0 &mdash; Optimal Window',
      advisory:
        'Seed inoculation with bio-fungicides and Rhizobium/Azospirillum, followed by line sowing at recommended spacing.',
      checklist: [
        'Treat seeds with Trichoderma viride or approved bio-formulations',
        'Inoculate legume seeds with crop-specific Rhizobium culture',
        'Maintain uniform row-to-row spacing using seed drills',
      ],
    },
    {
      step: 4,
      name: 'Vegetative Growth',
      icon: Leaf,
      timing: 'Days 15 - 45',
      advisory:
        'Early weed control, thinning, and gap filling to establish optimal plant population density.',
      checklist: [
        'Conduct first weeding / hoeing at 20-25 days after sowing',
        'Monitor root development and early branch / tiller initiation',
        'Ensure proper soil aeration around root zones',
      ],
    },
    {
      step: 5,
      name: 'Water & Nutrients',
      icon: Droplets,
      timing: 'Critical Milestones',
      advisory:
        'Timed split applications of nitrogenous top-dressings and micro-irrigation scheduling.',
      checklist: [
        'Apply split dose of nitrogen during active moisture windows',
        'Protect against water stress during tillering and panicle initiation',
        'Foliar application of micronutrients if deficiency appears',
      ],
    },
    {
      step: 6,
      name: 'Pest Monitoring',
      icon: Eye,
      timing: 'Weekly Scouting',
      advisory:
        'Field scouting using yellow sticky traps and pheromone lures; integrated pest management protocols.',
      checklist: [
        'Install 5 pheromone traps per acre for early pest detection',
        'Use neem-based bio-pesticides at initial insect sighting',
        'Targeted chemical intervention only if economic threshold is breached',
      ],
    },
    {
      step: 7,
      name: 'Harvesting',
      icon: Wheat,
      timing: 'Physiological Maturity',
      advisory:
        'Harvest when 85-90% of grains/foliage turn golden yellow and moisture drops to physiological maturity.',
      checklist: [
        'Cease irrigation 10-12 days prior to scheduled harvest date',
        'Harvest during dry weather to prevent moisture mold and lodging',
        'Carefully thresh and separate chaff to avoid kernel damage',
      ],
    },
    {
      step: 8,
      name: 'Post-Harvest & Storage',
      icon: Warehouse,
      timing: 'Immediate Post-Harvest',
      advisory:
        'Sun drying produce down to safe storage moisture limits (12-14% for cereals, 8-9% for oilseeds).',
      checklist: [
        'Sun-dry grain on clean tarpaulins for 2-3 consecutive days',
        'Verify grain moisture before bagging',
        'Store in airtight hermetic bags raised on wooden pallets',
      ],
    },
    {
      step: 9,
      name: 'Market & Selling',
      icon: IndianRupee,
      timing: 'Marketing Window',
      advisory:
        'Compare nearby APMC Mandi rates, e-NAM digital quotes, and FPO collective bulk bargaining.',
      checklist: [
        'Check price trends on Agmarknet and e-NAM for your grade',
        'Explore local FPO aggregation for bulk logistics cost reduction',
        'Evaluate warehouse storage receipts for delayed selling options',
      ],
    },
  ];

  const current = stages[activeStage];

  return (
    <section id="crop-lifecycle" className="py-14 md:py-20 bg-[#F1F5EE] border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#245C3A] mb-2">
            End-to-End Agronomy
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252B26] tracking-tight">
            The Complete Crop Lifecycle
          </h2>
          <p className="mt-3 text-sm text-[#687168] leading-relaxed">
            Crop360 AI connects decisions through nine sequential stages. Actions taken during land
            preparation directly affect seed rates, water needs, and harvest quality.
          </p>
        </div>

        {/* 9-Stage Clean Stepper on Desktop */}
        <div className="hidden lg:block mb-8 overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[850px] relative">
            <div className="absolute top-5 left-4 right-4 h-px bg-[#E3E8DF] z-0" />
            {stages.map((stage, idx) => {
              const isSelected = activeStage === idx;
              const isPast = activeStage > idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className="relative z-10 flex flex-col items-center group text-center focus:outline-none"
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors ${
                      isSelected
                        ? 'bg-[#245C3A] text-white border-[#245C3A]'
                        : isPast
                          ? 'bg-[#E7EFE6] text-[#245C3A] border-[#CFDEC9]'
                          : 'bg-[#FAFAF6] text-[#687168] border-[#E3E8DF] hover:border-[#245C3A]'
                    }`}
                  >
                    {stage.step}
                  </div>
                  <span
                    className={`mt-2 text-xs transition-colors ${
                      isSelected
                        ? 'font-semibold text-[#245C3A]'
                        : 'text-[#687168] group-hover:text-[#252B26]'
                    }`}
                  >
                    {stage.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Stage Selector Dropdown */}
        <div className="lg:hidden mb-6">
          <label
            htmlFor="mobile-stage-select"
            className="block text-xs font-semibold text-[#252B26] mb-1.5"
          >
            Select Lifecycle Stage:
          </label>
          <select
            id="mobile-stage-select"
            value={activeStage}
            onChange={(e) => setActiveStage(Number(e.target.value))}
            className="w-full p-2.5 rounded-lg border border-[#E3E8DF] bg-white text-xs text-[#252B26] font-medium"
          >
            {stages.map((s, idx) => (
              <option key={idx} value={idx}>
                Stage {s.step}: {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Detailed Stage Content Card - Clean & Minimal */}
        <div className="rounded-xl border border-[#E3E8DF] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E3E8DF]">
            <div>
              <span className="text-[11px] font-semibold text-[#245C3A] uppercase tracking-wider">
                Stage {current.step} of 9 &bull; {current.timing}
              </span>
              <h3 className="text-xl font-bold text-[#252B26] mt-0.5">{current.name}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveStage((p) => (p > 0 ? p - 1 : p))}
                disabled={activeStage === 0}
                className="px-3 py-1.5 rounded-md border border-[#E3E8DF] text-xs font-medium text-[#252B26] disabled:opacity-30 hover:bg-[#F1F5EE]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setActiveStage((p) => (p < stages.length - 1 ? p + 1 : p))}
                disabled={activeStage === stages.length - 1}
                className="px-3 py-1.5 rounded-md bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-medium disabled:opacity-30"
              >
                Next Stage
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#687168] mb-2">
                Agronomic Strategic Guidance
              </h4>
              <p className="text-xs sm:text-sm text-[#252B26] leading-relaxed bg-[#FAFAF6] p-4 rounded-lg border border-[#E3E8DF]">
                {current.advisory}
              </p>
            </div>

            <div className="lg:col-span-7">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#687168] mb-2">
                Operational Checklist
              </h4>
              <div className="space-y-2">
                {current.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-[#252B26]"
                  >
                    <Check className="h-4 w-4 text-[#245C3A] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
