import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITillageOperation {
  stepNumber: number;
  operationName: string; // e.g. "Deep Summer Mouldboard Ploughing", "Disc Harrowing", "Rotavator Till"
  implementType: 'mouldboard_plough' | 'disc_harrow' | 'cultivator' | 'rotavator' | 'ridger' | 'bund_former' | 'leveler';
  targetDepthInches: number;
  timingDaysBeforeSowing: number;
  purpose: string;
  isCompleted: boolean;
  completedDate?: Date;
}

export interface ILandPreparationPlan extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  cropName: string;
  season: string;
  tillageType: 'conventional' | 'minimum_tillage' | 'zero_tillage' | 'puddled_wetland';
  basalFYMApplicationTonnesPerAcre: number;
  soilAmendmentRequired?: string; // e.g. "Gypsum 200kg" or "Lime 150kg"
  operations: ITillageOperation[];
  readinessScorePercent: number; // 0 - 100
  status: 'planning' | 'in_progress' | 'seedbed_ready';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TillageOperationSchema = new Schema<ITillageOperation>(
  {
    stepNumber: { type: Number, required: true },
    operationName: { type: String, required: true },
    implementType: {
      type: String,
      enum: ['mouldboard_plough', 'disc_harrow', 'cultivator', 'rotavator', 'ridger', 'bund_former', 'leveler'],
      required: true,
    },
    targetDepthInches: { type: Number, required: true },
    timingDaysBeforeSowing: { type: Number, required: true },
    purpose: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    completedDate: { type: Date },
  },
  { _id: false }
);

const LandPreparationPlanSchema = new Schema<ILandPreparationPlan>(
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
    cropName: {
      type: String,
      required: true,
    },
    season: {
      type: String,
      default: 'Kharif 2026',
    },
    tillageType: {
      type: String,
      enum: ['conventional', 'minimum_tillage', 'zero_tillage', 'puddled_wetland'],
      default: 'conventional',
    },
    basalFYMApplicationTonnesPerAcre: {
      type: Number,
      default: 5,
    },
    soilAmendmentRequired: {
      type: String,
    },
    operations: [TillageOperationSchema],
    readinessScorePercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['planning', 'in_progress', 'seedbed_ready'],
      default: 'planning',
      index: true,
    },
    notes: String,
  },
  {
    timestamps: true,
    collection: 'land_prep_plans',
  }
);

export const LandPreparationPlan: Model<ILandPreparationPlan> =
  mongoose.models.LandPreparationPlan ||
  mongoose.model<ILandPreparationPlan>('LandPreparationPlan', LandPreparationPlanSchema);
