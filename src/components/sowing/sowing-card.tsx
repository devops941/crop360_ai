'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowRight,
  Trash2,
  CheckCircle,
  Sprout,
} from 'lucide-react';

export interface SowingRecordItem {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string; district: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string; totalAreaAcres: number };
  cropName: string;
  varietyName: string;
  sowingDate: string;
  plantingMethod: string;
  spacingCm: { rowToRowCm: number; plantToPlantCm: number };
  plantPopulationPerAcre: number;
  nurseryAgeDays?: number;
  targetHarvestDateEstimated: string;
  actualSeedRateUsedKg: number;
  depthOfSowingCm: number;
  status: 'planned' | 'sown' | 'germination_verified' | 'failed_resown';
}

export const formatPlantingMethod = (method: string): string => {
  const map: Record<string, string> = {
    furrow_sett_planting: 'Furrow Sett Planting',
    ridge_dibbling: 'Ridge Dibbling',
    pit_planting: 'Pit Planting',
    direct_seeding: 'Direct Seeding (DSR)',
    transplanting: 'Transplanting (Nursery)',
    dibbling: 'Dibbling',
    broadcasting: 'Broadcasting',
    drip_fertigation_line: 'Drip Raised Bed',
  };
  return map[method] || (method ? method.replace(/_/g, ' ') : 'Standard Sowing');
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  planned: {
    label: 'Planned',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
  },
  sown: {
    label: 'Sown / Planted',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  germination_verified: {
    label: 'Germinated',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
  },
  failed_resown: {
    label: 'Re-sown',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700',
  },
};

export interface SowingCardProps {
  record: SowingRecordItem;
  updatingStatusId?: string | null;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Reusable Sowing Card Component
 */
export function SowingCard({
  record,
  updatingStatusId,
  onUpdateStatus,
  onDelete,
}: SowingCardProps) {
  const harvestDate = new Date(record.targetHarvestDateEstimated);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-white dark:bg-[#1a231d] rounded-2xl border border-[#245C3A]/15 p-5 shadow-xs hover:border-[#245C3A]/30 transition space-y-4">
      {/* Top Header: Farmer info & Crop Title */}
      <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-stone-800 gap-2">
        <div className="space-y-0.5">
          <span className="text-[11px] font-mono text-[#245C3A] font-bold block uppercase tracking-wider">
            {record.farmerId?.name || 'Registered Farmer'} {record.farmerId?.district ? `(${record.farmerId.district})` : ''}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {record.cropName} — {record.varietyName}
          </h3>
          <p className="text-xs text-stone-500">
            Parcel: {record.farmId?.parcelName || 'Field'} {record.farmId?.surveyNumber ? `(Survey #${record.farmId.surveyNumber})` : ''}
          </p>
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(record._id)}
          className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer shrink-0"
          title="Delete sowing record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Geometry & Density Grid */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800/60 text-xs">
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
            Geometry
          </span>
          <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
            {record.spacingCm.rowToRowCm} × {record.spacingCm.plantToPlantCm} cm
          </span>
        </div>
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
            Plant Population
          </span>
          <span className="font-bold text-[#245C3A] dark:text-emerald-400 font-mono">
            {record.plantPopulationPerAcre.toLocaleString('en-IN')} / ac
          </span>
        </div>
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
            Method
          </span>
          <span className="font-bold text-stone-800 dark:text-stone-200 block truncate" title={formatPlantingMethod(record.plantingMethod)}>
            {formatPlantingMethod(record.plantingMethod)}
          </span>
        </div>
      </div>

      {/* Harvest Projection */}
      <div className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <div>
            <span className="text-stone-500 block text-[10px]">Estimated Harvest Date</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">
              {harvestDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
          {daysRemaining} Days Remaining
        </span>
      </div>

      {/* Footer: Quick Status Action & Next Stage Link */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {record.status === 'planned' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(record._id, 'sown')}
              disabled={updatingStatusId === record._id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark as Sown ✓
            </button>
          )}
          {record.status === 'sown' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(record._id, 'germination_verified')}
              disabled={updatingStatusId === record._id}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Sprout className="w-3.5 h-3.5" />
              Verify Germination ✓
            </button>
          )}
          {record.status === 'germination_verified' && (
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 inline-flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Germination Confirmed
            </span>
          )}
        </div>

        {record.status === 'sown' || record.status === 'germination_verified' ? (
          <Link
            href={`/crop-growth?farmerId=${record.farmerId?._id || ''}&farmId=${record.farmId?._id || ''}&cropName=${encodeURIComponent(record.cropName)}&openModal=true`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow-xs transition ml-auto cursor-pointer"
          >
            <span>Proceed to Crop Growth & Canopy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 text-xs font-medium border border-stone-200 dark:border-stone-700 ml-auto cursor-not-allowed"
            title="Mark sowing as Sown or Germinated first before monitoring crop growth"
          >
            <span>Complete Sowing First</span>
          </div>
        )}
      </div>
    </div>
  );
}
