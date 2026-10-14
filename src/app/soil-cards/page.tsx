'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Award, Printer, ShieldCheck, QrCode, FileText } from 'lucide-react';

interface SoilCardItem {
  _id: string;
  cardNumber: string;
  reportId: { _id: string; sampleCode: string; testDate: string };
  farmerId: { _id: string; name: string; farmerCode: string; phone: string; district: string; state: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres: number; soilType: string };
  issuedDate: string;
  expiryDate: string;
  qrVerificationCode: string;
  cycle: string;
  cardDataSnapshot: {
    farmerName: string;
    farmerCode: string;
    phone: string;
    district: string;
    state: string;
    parcelName: string;
    surveyNumber: string;
    totalAreaAcres: number;
    soilType: string;
    overallHealthScore: number;
    fertilityRating: string;
    phValue: number;
    ecValue: number;
    ocValue: number;
    nitrogenValue: number;
    phosphorusValue: number;
    potassiumValue: number;
    topRecommendations: string[];
  };
  status: 'active' | 'superseded' | 'revoked';
}

export default function SoilCardsPage() {
  const [cards, setCards] = useState<SoilCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/soil-cards');
        const json = await res.json();
        if (json.success && json.data) {
          setCards(json.data);
          if (json.data.length > 0) setActiveCardId(json.data[0]._id);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeCard = cards.find((c) => c._id === activeCardId) || cards[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#245C3A]/10 print:hidden">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#245C3A]/10 text-[#245C3A] border border-[#245C3A]/20">
              Module 5
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#193D2A] dark:text-[#E8F0E9]">
              Soil Health Card (SHC) Issuance
            </h1>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Official government-standard digital soil health certificates with immutable physical snapshot and QR validation.
          </p>
        </div>

        {activeCard && (
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-sm font-semibold shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print / Export Soil Card PDF
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-stone-500">Loading Soil Health Cards...</div>
      ) : cards.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1a231d] rounded-2xl border border-dashed border-[#245C3A]/20">
          <Award className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">No Soil Health Cards Issued</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
            Soil Health Cards are automatically generated after completing an AI Soil Analysis in Module 4.
          </p>
          <Link
            href="/soil-reports"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245C3A] text-white text-sm font-semibold shadow"
          >
            Go to Soil Reports
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Selector on Desktop */}
          <div className="lg:col-span-4 space-y-2 print:hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Issued Cards ({cards.length})
            </h3>
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {cards.map((card) => {
                const isSelected = card._id === activeCard?._id;
                return (
                  <button
                    key={card._id}
                    onClick={() => setActiveCardId(card._id)}
                    className={`w-full text-left p-4 rounded-xl border transition ${
                      isSelected
                        ? 'bg-white dark:bg-[#1a231d] border-[#245C3A] shadow ring-1 ring-[#245C3A]'
                        : 'bg-white/60 dark:bg-[#1a231d]/60 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#245C3A]">
                        {card.cardNumber}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 font-semibold uppercase">
                        {card.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
                      {card.cardDataSnapshot.farmerName}
                    </div>
                    <div className="text-xs text-stone-500">
                      {card.cardDataSnapshot.parcelName} ({card.cardDataSnapshot.totalAreaAcres} Acres)
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Printable Official Card Template */}
          {activeCard && (
            <div className="lg:col-span-8">
              <div
                ref={printableRef}
                className="bg-[#FCFDF9] dark:bg-[#131b15] border-2 border-[#245C3A] rounded-2xl p-6 md:p-10 shadow-lg text-stone-900 dark:text-stone-100 print:border-black print:p-4 print:shadow-none print:m-0"
              >
                {/* Government & AI Header Badge */}
                <div className="border-b-2 border-[#245C3A] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#245C3A] text-white flex items-center justify-center font-bold text-xl shadow-md">
                      C360
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#245C3A] block">
                        Government of India • Ministry of Agriculture & Farmers Welfare
                      </span>
                      <h2 className="text-2xl font-black text-[#193D2A] dark:text-[#E8F0E9] tracking-tight">
                        DIGITAL SOIL HEALTH CARD
                      </h2>
                      <p className="text-xs text-stone-500 font-medium">
                        National Mission for Sustainable Agriculture (NMSA) Compliant
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right font-mono text-xs space-y-0.5">
                    <div className="font-bold text-[#193D2A] dark:text-[#E8F0E9]">
                      CARD: {activeCard.cardNumber}
                    </div>
                    <div className="text-stone-500">Issued: {new Date(activeCard.issuedDate).toLocaleDateString()}</div>
                    <div className="text-stone-500">Valid Till: {new Date(activeCard.expiryDate).toLocaleDateString()}</div>
                    <div className="text-stone-500 font-semibold text-[#245C3A]">{activeCard.cycle}</div>
                  </div>
                </div>

                {/* Farmer & Parcel Bio-Data Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-[#245C3A]/20 text-xs">
                  <div>
                    <span className="text-stone-500 uppercase tracking-wider block font-semibold text-[10px]">
                      Farmer Name
                    </span>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {activeCard.cardDataSnapshot.farmerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase tracking-wider block font-semibold text-[10px]">
                      Farmer ID Code
                    </span>
                    <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                      {activeCard.cardDataSnapshot.farmerCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase tracking-wider block font-semibold text-[10px]">
                      Location
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {activeCard.cardDataSnapshot.district}, {activeCard.cardDataSnapshot.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase tracking-wider block font-semibold text-[10px]">
                      Phone Number
                    </span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">
                      {activeCard.cardDataSnapshot.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 uppercase tracking-wider block font-semibold text-[10px]">
                      Parcel Name
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {activeCard.cardDataSnapshot.parcelName}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase tracking-wider block font-semibold text-[10px]">
                      Survey Number
                    </span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">
                      {activeCard.cardDataSnapshot.surveyNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase tracking-wider block font-semibold text-[10px]">
                      Total Area
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {activeCard.cardDataSnapshot.totalAreaAcres} Acres
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase tracking-wider block font-semibold text-[10px]">
                      Soil Texture
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 capitalize">
                      {activeCard.cardDataSnapshot.soilType} Soil
                    </span>
                  </div>
                </div>

                {/* Score & Chemical Table */}
                <div className="py-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#193D2A] dark:text-[#E8F0E9] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#245C3A]" />
                      Soil Test Results & Nutrient Ratings
                    </h4>
                    <span className="px-3 py-1 rounded-full bg-[#245C3A] text-white text-xs font-bold">
                      Health Index: {activeCard.cardDataSnapshot.overallHealthScore}/100 ({activeCard.cardDataSnapshot.fertilityRating.toUpperCase()})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center">
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">pH Reaction</span>
                      <span className="text-lg font-black text-[#193D2A] dark:text-[#E8F0E9] mt-0.5 block">
                        {activeCard.cardDataSnapshot.phValue}
                      </span>
                      <span className="text-[10px] text-stone-400">Benchmark: 6.5-7.5</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center">
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">EC (dS/m)</span>
                      <span className="text-lg font-black text-[#193D2A] dark:text-[#E8F0E9] mt-0.5 block">
                        {activeCard.cardDataSnapshot.ecValue}
                      </span>
                      <span className="text-[10px] text-stone-400">&lt; 1.0 Normal</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center">
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Org. Carbon</span>
                      <span className="text-lg font-black text-[#193D2A] dark:text-[#E8F0E9] mt-0.5 block">
                        {activeCard.cardDataSnapshot.ocValue}%
                      </span>
                      <span className="text-[10px] text-stone-400">0.50 - 0.75%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center">
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Nitrogen (N)</span>
                      <span className="text-lg font-black text-[#193D2A] dark:text-[#E8F0E9] mt-0.5 block">
                        {activeCard.cardDataSnapshot.nitrogenValue}
                      </span>
                      <span className="text-[10px] text-stone-400">kg / hectare</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center">
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Phosphorus (P)</span>
                      <span className="text-lg font-black text-[#193D2A] dark:text-[#E8F0E9] mt-0.5 block">
                        {activeCard.cardDataSnapshot.phosphorusValue}
                      </span>
                      <span className="text-[10px] text-stone-400">kg / hectare</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center">
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Potassium (K)</span>
                      <span className="text-lg font-black text-[#193D2A] dark:text-[#E8F0E9] mt-0.5 block">
                        {activeCard.cardDataSnapshot.potassiumValue}
                      </span>
                      <span className="text-[10px] text-stone-400">kg / hectare</span>
                    </div>
                  </div>
                </div>

                {/* Top Fertilizer Recommendations */}
                <div className="py-4 border-t border-[#245C3A]/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-3">
                    Prescribed Soil Remediation & Fertilizer Dosage
                  </h4>
                  <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                    {activeCard.cardDataSnapshot.topRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#245C3A] mt-1.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Verification QR & Seal Footer */}
                <div className="mt-6 pt-6 border-t-2 border-[#245C3A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700">
                      <QrCode className="w-10 h-10 text-stone-800 dark:text-stone-200" />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] block font-semibold text-stone-800 dark:text-stone-200">
                        {activeCard.qrVerificationCode}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Scan to verify authentic laboratory issuance on Crop360 Public Portal
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#245C3A] font-bold">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Cryptographically Signed & Archived</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
