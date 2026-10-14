import mongoose, { Document, Model, Schema } from 'mongoose';

export type ControlStrategy = 'cultural' | 'biological' | 'chemical' | 'integrated';
export type SprayStatus = 'recommended' | 'scheduled' | 'completed' | 'skipped';
export type SprayMethod = 'knapsack_spray' | 'power_sprayer' | 'drone_spray' | 'soil_drenching' | 'seed_treatment';

export interface ICropProtection extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  detectionId?: mongoose.Types.ObjectId;
  cropName: string;
  targetPestOrDisease: string;
  controlStrategy: ControlStrategy;
  recommendedFormulation: string;
  cibrcRegistrationNumber?: string;
  dilutionDosagePerLiter: string;
  sprayVolumeLitersPerAcre: number;
  waitingPeriodDaysPHI: number;
  safetyPrecautions: string[];
  applicationMethod: SprayMethod;
  sprayStatus: SprayStatus;
  scheduledSprayDate?: Date;
  completedDate?: Date;
  estimatedCostInrPerAcre: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CropProtectionSchema = new Schema<ICropProtection>(
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
    detectionId: {
      type: Schema.Types.ObjectId,
      ref: 'PestDetection',
      index: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    targetPestOrDisease: {
      type: String,
      required: true,
      trim: true,
    },
    controlStrategy: {
      type: String,
      enum: ['cultural', 'biological', 'chemical', 'integrated'],
      default: 'integrated',
      required: true,
    },
    recommendedFormulation: {
      type: String,
      required: true,
      trim: true,
    },
    cibrcRegistrationNumber: {
      type: String,
      trim: true,
      default: 'CIBRC-REG-CERTIFIED',
    },
    dilutionDosagePerLiter: {
      type: String,
      required: true,
      default: '2.5 ml / L',
    },
    sprayVolumeLitersPerAcre: {
      type: Number,
      required: true,
      default: 200,
    },
    waitingPeriodDaysPHI: {
      type: Number,
      required: true,
      default: 7,
      min: 0,
    },
    safetyPrecautions: {
      type: [String],
      default: [
        'Wear PPE mask, nitrile gloves and safety eye goggles',
        'Avoid spraying against wind direction',
        'Maintain minimum 7 days Pre-Harvest Interval (PHI)',
      ],
    },
    applicationMethod: {
      type: String,
      enum: ['knapsack_spray', 'power_sprayer', 'drone_spray', 'soil_drenching', 'seed_treatment'],
      default: 'knapsack_spray',
    },
    sprayStatus: {
      type: String,
      enum: ['recommended', 'scheduled', 'completed', 'skipped'],
      default: 'recommended',
      index: true,
    },
    scheduledSprayDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    estimatedCostInrPerAcre: {
      type: Number,
      default: 650,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'crop_protections',
  }
);

export const CropProtectionModel: Model<ICropProtection> =
  mongoose.models.CropProtection || mongoose.model<ICropProtection>('CropProtection', CropProtectionSchema);
