'use client';

import React, { useState } from 'react';
import { Sprout, AlertCircle, MapPin, Calendar, Layers } from 'lucide-react';

interface IndianCrop {
  id: string;
  name: string;
  vernacular: string;
  category: string;
  season: string;
  preferredSoil: string;
  regions: string;
  waterNeed: string;
  keyAdvisory: string;
  tag: string;
}

export function IndianCropsSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const crops: IndianCrop[] = [
    {
      id: 'paddy',
      name: 'Paddy (Rice)',
      vernacular: 'धान / நெல்',
      category: 'cereals',
      season: 'Kharif & Samba',
      preferredSoil: 'Clayey to Clay Loam with high water retention',
      regions: 'Punjab, Haryana, West Bengal, Tamil Nadu, Andhra Pradesh',
      waterNeed: 'High (Puddled / Alternate Wetting & Drying)',
      keyAdvisory:
        'Monitor panicle initiation stage for stem borer. Basal zinc application is essential in alkaline soils.',
      tag: 'Staple Cereal',
    },
    {
      id: 'cotton',
      name: 'Cotton',
      vernacular: 'कपास / பருத்தி',
      category: 'commercial',
      season: 'Kharif',
      preferredSoil: 'Deep Black Cotton Soil (Regur) with good drainage',
      regions: 'Gujarat, Maharashtra, Telangana, Karnataka, Punjab',
      waterNeed: 'Moderate (Critical during flowering & boll formation)',
      keyAdvisory:
        'Install pink bollworm pheromone traps by 45 DAS. Avoid excess nitrogen to prevent vegetative overshoot.',
      tag: 'Cash Crop',
    },
    {
      id: 'sugarcane',
      name: 'Sugarcane',
      vernacular: 'गन्ना / கரும்பு',
      category: 'commercial',
      season: 'Annual (10–14 Months)',
      preferredSoil: 'Well-drained deep loams to clay loams',
      regions: 'Uttar Pradesh, Maharashtra, Karnataka, Tamil Nadu',
      waterNeed: 'High (Furrow or drip irrigation)',
      keyAdvisory:
        'Earthing-up at 90–120 days prevents lodging. High trash mulching conserves root zone moisture.',
      tag: 'Commercial Perennial',
    },
    {
      id: 'groundnut',
      name: 'Groundnut (Peanut)',
      vernacular: 'मूंगफली / நிலக்கடலை',
      category: 'oilseeds',
      season: 'Kharif & Rabi Summer',
      preferredSoil: 'Sandy Loam, Red Sandy Loam with loose texture',
      regions: 'Gujarat, Andhra Pradesh, Tamil Nadu, Rajasthan',
      waterNeed: 'Low to Medium (Critical at pegging and pod development)',
      keyAdvisory:
        'Gypsum application (200 kg/acre) at 40–45 DAS is critical for pod filling and shell hardening.',
      tag: 'High-Value Oilseed',
    },
    {
      id: 'banana',
      name: 'Banana (G9 / Traditional)',
      vernacular: 'केला / வாழை',
      category: 'horticulture',
      season: 'Year-Round Planting',
      preferredSoil: 'Rich Alluvial, Deep fertile loam (pH 6.0–7.5)',
      regions: 'Tamil Nadu, Maharashtra, Gujarat, Andhra Pradesh, Kerala',
      waterNeed: 'High (Drip fertigation strongly recommended)',
      keyAdvisory:
        'High potassium requirement during bunch emergence. Timely de-suckering ensures maximum bunch weight.',
      tag: 'Horticulture Fruit',
    },
    {
      id: 'vegetables',
      name: 'Vegetables (Tomato / Chilli)',
      vernacular: 'सब्जियां / காய்கறிகள்',
      category: 'horticulture',
      season: 'Rabi, Kharif & Zaid',
      preferredSoil: 'Well-drained Sandy Loam rich in organic matter',
      regions: 'Karnataka, Andhra Pradesh, Madhya Pradesh, Maharashtra',
      waterNeed: 'Controlled (Drip with plastic mulch recommended)',
      keyAdvisory:
        'Strict staking, scheduled fertigation, and yellow sticky traps for whitefly and leaf curl control.',
      tag: 'High-Turnover Vegetable',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Crops' },
    { id: 'cereals', label: 'Cereals & Staples' },
    { id: 'commercial', label: 'Commercial Crops' },
    { id: 'oilseeds', label: 'Pulses & Oilseeds' },
    { id: 'horticulture', label: 'Horticulture & Fruits' },
  ];

  const filteredCrops =
    selectedCategory === 'all' ? crops : crops.filter((c) => c.category === selectedCategory);

  return (
    <section id="crop-planning" className="py-14 md:py-20 bg-[#FAFAF6] border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#245C3A] mb-2">
            Regional Agronomic Coverage
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252B26] tracking-tight">
            Built for Indian Agricultural Realities
          </h2>
          <p className="mt-3 text-sm text-[#687168] leading-relaxed">
            From the fertile delta paddies of Tamil Nadu and Andhra Pradesh to the black cotton
            soils of Maharashtra and Gujarat—Crop360 AI is calibrated for India&apos;s diverse
            agro-climatic zones, soil classifications, and seasonal rainfall patterns.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#245C3A] text-white border-[#245C3A]'
                  : 'bg-white text-[#687168] border-[#E3E8DF] hover:bg-[#F1F5EE] hover:text-[#252B26]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Crop Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <div
              key={crop.id}
              className="rounded-xl border border-[#E3E8DF] bg-white p-6 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-medium text-[#245C3A] bg-[#E7EFE6] px-2 py-0.5 rounded">
                      {crop.tag}
                    </span>
                    <h3 className="text-base font-bold text-[#252B26] mt-2">{crop.name}</h3>
                    <p className="text-xs text-[#687168] font-medium mt-0.5">{crop.vernacular}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-[#F1F5EE] flex items-center justify-center text-[#245C3A] shrink-0">
                    <Sprout className="h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-[#687168] pt-3 border-t border-[#E3E8DF]">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#687168] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#252B26]">Season: </span>
                      {crop.season}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Layers className="h-3.5 w-3.5 text-[#687168] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#252B26]">Soil Affinity: </span>
                      {crop.preferredSoil}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#687168] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#252B26]">Key Regions: </span>
                      {crop.regions}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[#F1F5EE] border border-[#E3E8DF] text-xs text-[#252B26]">
                  <span className="font-semibold text-[#245C3A]">Agronomic Insight: </span>
                  {crop.keyAdvisory}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Regional Adaptability Notice */}
        <div className="mt-10 p-4 rounded-xl bg-[#F1F5EE] border border-[#E3E8DF] flex items-start gap-3 text-xs text-[#252B26] max-w-3xl mx-auto">
          <AlertCircle className="h-4 w-4 text-[#245C3A] shrink-0 mt-0.5" />
          <span>
            <strong>Regional Suitability Note:</strong> Crop recommendations in Crop360 AI evaluate
            your specific district, local irrigation source (borewell, canal, or rainfed), and
            laboratory soil test parameters. Recommendations are verified against ICAR and State
            Agricultural University packages of practices.
          </span>
        </div>
      </div>
    </section>
  );
}
