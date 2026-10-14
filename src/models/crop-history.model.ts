import mongoose, { Schema, Document, Model } from 'mongoose';

export type AgriSeason = 'KHARIF' | 'RABI' | 'ZAID';

export interface IHistoricalSeasonRecord {
  year: number;
  season: AgriSeason;
  cropName: string;
  variety: string;
  areaCultivatedAcres: number;
  totalYieldKg: number;
  yieldPerAcreKg: number;
  totalExpenseINR: number;
  grossRevenueINR: number;
  netProfitINR: number;
  soilOrganicCarbonPercent?: number; // e.g., 0.45% -> 0.72% over 3 years
  waterConsumedMm?: number;
  fertilizerUsedKg?: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  notes?: string;
}

export interface ICropHistory extends Document {
  farmerId: string;
  farmId: string;
  fieldPlotName: string;
  annualHistory: IHistoricalSeasonRecord[];
  benchmarks: {
    districtAverageYieldKgAcre: number;
    stateAverageYieldKgAcre: number;
    topPercentileYieldKgAcre: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const HistoricalSeasonRecordSchema = new Schema<IHistoricalSeasonRecord>(
  {
    year: { type: Number, required: true },
    season: { type: String, enum: ['KHARIF', 'RABI', 'ZAID'], required: true },
    cropName: { type: String, required: true },
    variety: { type: String, required: true },
    areaCultivatedAcres: { type: Number, required: true },
    totalYieldKg: { type: Number, required: true },
    yieldPerAcreKg: { type: Number, required: true },
    totalExpenseINR: { type: Number, required: true },
    grossRevenueINR: { type: Number, required: true },
    netProfitINR: { type: Number, required: true },
    soilOrganicCarbonPercent: { type: Number },
    waterConsumedMm: { type: Number },
    fertilizerUsedKg: {
      nitrogen: { type: Number, default: 0 },
      phosphorus: { type: Number, default: 0 },
      potassium: { type: Number, default: 0 },
    },
    notes: { type: String },
  },
  { _id: false }
);

const CropHistorySchema = new Schema<ICropHistory>(
  {
    farmerId: { type: String, required: true, index: true },
    farmId: { type: String, required: true, index: true },
    fieldPlotName: { type: String, required: true },
    annualHistory: [HistoricalSeasonRecordSchema],
    benchmarks: {
      districtAverageYieldKgAcre: { type: Number, default: 2200 },
      stateAverageYieldKgAcre: { type: Number, default: 2450 },
      topPercentileYieldKgAcre: { type: Number, default: 3200 },
    },
  },
  { timestamps: true }
);

export const CropHistory: Model<ICropHistory> =
  mongoose.models.CropHistory || mongoose.model<ICropHistory>('CropHistory', CropHistorySchema);
