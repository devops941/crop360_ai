import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICostBreakdown {
  seedCost: number;
  landPrepCost: number;
  fertilizerNutrientCost: number;
  cropProtectionCost: number;
  irrigationCost: number;
  laborCost: number;
  harvestingCost: number;
  logisticsCost: number;
}

export interface ICropPnl extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  sowingId?: mongoose.Types.ObjectId;
  cropName: string;
  varietyName: string;
  season: string;
  areaAcres: number;
  costBreakdown: ICostBreakdown;
  totalCostOfCultivationInr: number;
  grossMandiRevenueInr: number;
  netProfitInr: number;
  netRoiPercent: number;
  costPerQuintalInr: number;
  totalYieldQuintals: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CostBreakdownSchema = new Schema<ICostBreakdown>(
  {
    seedCost: { type: Number, required: true, default: 0 },
    landPrepCost: { type: Number, required: true, default: 0 },
    fertilizerNutrientCost: { type: Number, required: true, default: 0 },
    cropProtectionCost: { type: Number, required: true, default: 0 },
    irrigationCost: { type: Number, required: true, default: 0 },
    laborCost: { type: Number, required: true, default: 0 },
    harvestingCost: { type: Number, required: true, default: 0 },
    logisticsCost: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const CropPnlSchema = new Schema<ICropPnl>(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    sowingId: {
      type: Schema.Types.ObjectId,
      ref: 'SowingRecord',
      index: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    varietyName: {
      type: String,
      required: true,
      trim: true,
    },
    season: {
      type: String,
      default: 'Samba / Kharif',
      trim: true,
    },
    areaAcres: {
      type: Number,
      required: true,
      default: 1.0,
      min: 0.1,
    },
    costBreakdown: {
      type: CostBreakdownSchema,
      required: true,
    },
    totalCostOfCultivationInr: {
      type: Number,
      required: true,
      min: 0,
    },
    grossMandiRevenueInr: {
      type: Number,
      required: true,
      min: 0,
    },
    netProfitInr: {
      type: Number,
      required: true,
    },
    netRoiPercent: {
      type: Number,
      required: true,
    },
    costPerQuintalInr: {
      type: Number,
      required: true,
      min: 0,
    },
    totalYieldQuintals: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'crop_pnl_ledgers',
  }
);

export const CropPnlModel: Model<ICropPnl> =
  mongoose.models.CropPnl || mongoose.model<ICropPnl>('CropPnl', CropPnlSchema);
