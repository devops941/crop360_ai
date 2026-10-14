import mongoose, { Document, Model, Schema } from 'mongoose';

export type GrowthStage =
  | 'germination'
  | 'seedling'
  | 'vegetative'
  | 'tillering'
  | 'flowering'
  | 'grain_filling'
  | 'maturity';

export type HealthStatus = 'excellent' | 'normal' | 'stressed' | 'chlorotic' | 'diseased';

export interface ICropGrowth extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  sowingId?: mongoose.Types.ObjectId;
  cropName: string;
  varietyName: string;
  observationDate: Date;
  growthStage: GrowthStage;
  plantHeightCm: number;
  canopyCoveragePercent: number;
  tillerCountPerPlant: number;
  healthStatus: HealthStatus;
  photoUrl?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CropGrowthSchema = new Schema<ICropGrowth>(
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
    observationDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    growthStage: {
      type: String,
      enum: [
        'germination',
        'seedling',
        'vegetative',
        'tillering',
        'flowering',
        'grain_filling',
        'maturity',
      ],
      default: 'vegetative',
      required: true,
    },
    plantHeightCm: {
      type: Number,
      required: true,
      min: 0,
    },
    canopyCoveragePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    tillerCountPerPlant: {
      type: Number,
      default: 1,
      min: 0,
    },
    healthStatus: {
      type: String,
      enum: ['excellent', 'normal', 'stressed', 'chlorotic', 'diseased'],
      default: 'normal',
      index: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'crop_growth_logs',
  }
);

export const CropGrowthModel: Model<ICropGrowth> =
  mongoose.models.CropGrowth || mongoose.model<ICropGrowth>('CropGrowth', CropGrowthSchema);
