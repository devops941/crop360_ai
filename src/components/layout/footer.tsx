'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, AlertCircle, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer id="about" className="w-full border-t border-[#E3E8DF] bg-[#FAFAF6] text-[#252B26]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#E3E8DF]">
          {/* Brand & Mission (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-3.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#245C3A] text-white">
                <Sprout className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#252B26]">
                Crop360 <span className="text-[#245C3A]">AI</span>
              </span>
            </Link>

            <p className="text-xs text-[#687168] leading-relaxed max-w-sm">
              &ldquo;From Soil to Harvest, Smarter Every Season.&rdquo;
              <br />
              An agricultural intelligence platform built for Indian farmers, FPOs, and rural
              agribusiness communities to link soil chemistry with practical cultivation and
              informed market decisions.
            </p>

            <div className="pt-1 flex flex-col gap-1 text-xs text-[#687168]">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#245C3A] shrink-0" />
                Bengaluru &bull; Coimbatore &bull; New Delhi, India
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#245C3A] shrink-0" />
                support@crop360.ai
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#252B26]">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-[#687168]">
              <li>
                <a href="#how-it-works" className="hover:text-[#245C3A] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#245C3A] transition-colors">
                  Core Capabilities
                </a>
              </li>
              <li>
                <a href="#crop-lifecycle" className="hover:text-[#245C3A] transition-colors">
                  9-Stage Crop Lifecycle
                </a>
              </li>
              <li>
                <a href="#soil-report" className="hover:text-[#245C3A] transition-colors">
                  Soil Report Preview
                </a>
              </li>
              <li>
                <a href="#crop-planning" className="hover:text-[#245C3A] transition-colors">
                  Indian Crops Supported
                </a>
              </li>
            </ul>
          </div>

          {/* Farmer & FPO Ecosystem */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#252B26]">
              Ecosystem
            </h4>
            <ul className="space-y-2 text-xs text-[#687168]">
              <li>
                <span>Farmer Producer Orgs (FPOs)</span>
              </li>
              <li>
                <span>Soil Testing Laboratories</span>
              </li>
              <li>
                <span>Krishi Vigyan Kendras (KVK)</span>
              </li>
              <li>
                <span>Mandi Price Advisory</span>
              </li>
              <li>
                <span>Soil Health Card (SHC) Alignment</span>
              </li>
            </ul>
          </div>

          {/* Governance & Privacy */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#252B26]">
              Governance
            </h4>
            <ul className="space-y-2 text-xs text-[#687168]">
              <li>
                <span>Privacy &amp; Data Rights</span>
              </li>
              <li>
                <span>Agronomic Advisory Standards</span>
              </li>
              <li>
                <span>Terms of Service</span>
              </li>
              <li>
                <span>Farmer Data Ownership</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Agricultural Guidance Disclaimer */}
        <div className="my-6 p-4 rounded-xl border border-[#E3E8DF] bg-[#F1F5EE] text-xs text-[#687168] leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-[#245C3A] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#252B26]">Agricultural Guidance Disclaimer:</strong> Crop360 AI
            provides advisory recommendations to assist cultivation planning and resource
            allocation. Recommendations are synthesized from laboratory soil readings,
            meteorological records, and validated ICAR / State Agricultural University package of
            practices. Final harvest outcomes depend on actual field execution, weather variations,
            and localized pest conditions. Farmers are advised to consult their local Krishi Vigyan
            Kendra (KVK) or Block Agriculture Officer for critical on-field interventions.
          </span>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#687168]">
          <p>&copy; {new Date().getFullYear()} Crop360 AI. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Dedicated to the farming communities of India</span>
            <span className="text-[#245C3A]">&bull;</span>
            <span className="font-medium text-[#252B26]">जय जवान, जय किसान</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
