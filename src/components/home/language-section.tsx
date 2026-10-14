'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';

export function LanguageSection() {
  const [selectedLang, setSelectedLang] = useState<'en' | 'ta' | 'hi'>('ta');

  const previews = {
    en: {
      langName: 'English',
      native: 'English',
      crop: 'Paddy (Kharif Season)',
      headline: 'Basal Fertilizer Application Advisory',
      soilStatus:
        'Soil pH 6.8 (Neutral) • Nitrogen: Low (180 kg/ha) • Available Phosphorus: Medium (16 kg/ha)',
      recommendation:
        'Apply 50 kg DAP and 25 kg MOP per acre at the final puddling stage. Delay top-dressing urea until 20–25 days after transplanting (DAS) to maximize root uptake and prevent leaching losses.',
      audioNote: 'Voice advisory support in regional dialects planned for future updates.',
    },
    ta: {
      langName: 'Tamil',
      native: 'தமிழ்',
      crop: 'நெல் சாகுபடி (சம்பா பருவம்)',
      headline: 'அடி உரம் இடுதல் மற்றும் மண் ஊட்டச்சத்து வழிகாட்டுதல்',
      soilStatus:
        'மண் கார அமிலத்தன்மை: pH 6.8 (சீரானது) • தழைச்சத்து: குறைவு • மணிச்சத்து: நடுத்தரம்',
      recommendation:
        'கடைசி உழவின் போது ஏக்கருக்கு 50 கிலோ டிஏபி மற்றும் 25 கிலோ பொட்டாஷ் அடியுரமாக இடவும். நட்ட 20 முதல் 25 நாட்களுக்குப் பிறகு முதல் தவணை யூரியாவை வேப்பம் புண்ணாக்கு கலந்து இடவும்.',
      audioNote:
        'கிராமப்புற விவசாயிகளுக்கான குரல் வழி வழிகாட்டுதல் (Voice Advisory) விரைவில் இணைகிறது.',
    },
    hi: {
      langName: 'Hindi',
      native: 'हिंदी',
      crop: 'धान की खेती (खरीफ मौसम)',
      headline: 'बेसल उर्वरक और पोषक तत्व प्रबंधन सलाह',
      soilStatus:
        'मृदा पीएच: 6.8 (सामान्य) • नाइट्रोजन: कम (180 किग्रा/हेक्टेयर) • फास्फोरस: मध्यम',
      recommendation:
        'अंतिम जुताई के समय प्रति एकड़ 50 किलो डीएपी और 25 किलो पोटाश डालें। रोपाई के 20-25 दिन बाद पहली बार यूरिया नीम लेपित रूप में दें ताकि उर्वरक का पूरा लाभ फसल को मिले।',
      audioNote: 'ग्रामीण किसानों के लिए स्थानीय भाषा में ऑडियो संदेश सुविधा शीघ्र उपलब्ध होगी।',
    },
  };

  const active = previews[selectedLang];

  const languages = [
    { id: 'en' as const, label: 'English' },
    { id: 'ta' as const, label: 'தமிழ் (Tamil)' },
    { id: 'hi' as const, label: 'हिंदी (Hindi)' },
  ];

  return (
    <section className="py-14 md:py-20 bg-[#FAFAF6] border-b border-[#E3E8DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#245C3A] mb-2">
            Vernacular Inclusivity
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252B26] tracking-tight">
            Accessible in Your Local Language
          </h2>
          <p className="mt-3 text-sm text-[#687168] leading-relaxed">
            Technology is truly useful only when farmers can read and understand it in their mother
            tongue. Switch the preview below to see how crop advisories are presented in English,
            தமிழ், and हिंदी.
          </p>
        </div>

        {/* Interactive Language Selector Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex gap-1.5 p-1 rounded-lg border border-[#E3E8DF] bg-white">
            {languages.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedLang(tab.id)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  selectedLang === tab.id
                    ? 'bg-[#245C3A] text-white'
                    : 'text-[#687168] hover:text-[#252B26] hover:bg-[#F1F5EE]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Card in Chosen Language */}
        <div className="max-w-2xl mx-auto rounded-xl border border-[#E3E8DF] bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E3E8DF]">
            <div>
              <span className="text-[11px] font-semibold text-[#245C3A] uppercase tracking-wider">
                {active.crop}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#252B26] mt-0.5">
                {active.headline}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#F1F5EE] text-[#687168] border border-[#E3E8DF]">
              {active.native} Mode
            </span>
          </div>

          <div className="mt-4 space-y-3.5">
            <div className="p-3 rounded-lg bg-[#F1F5EE] border border-[#E3E8DF] text-xs text-[#252B26]">
              <span className="font-semibold text-[#245C3A]">Soil Profile: </span>
              <span>{active.soilStatus}</span>
            </div>

            <div className="p-4 rounded-lg bg-[#FAFAF6] border border-[#E3E8DF] text-xs sm:text-sm text-[#252B26] leading-relaxed">
              &ldquo;{active.recommendation}&rdquo;
            </div>

            <div className="pt-3 border-t border-[#E3E8DF] flex items-center justify-between text-xs text-[#687168]">
              <div className="flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-[#245C3A]" />
                <span>{active.audioNote}</span>
              </div>
              <span className="hidden sm:inline text-[11px]">Illustrative Language Demo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
