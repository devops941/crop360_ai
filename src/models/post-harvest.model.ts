import mongoose, { Document, Model, Schema } from 'mongoose';

export type DryingMethod = 'tarpaulin_sun_drying' | 'mechanical_dryer' | 'solar_tunnel';
export type ConditioningStatus = 'drying' | 'conditioning' | 'certified' | 'dispatched_to_silo';

export interface IPostHarvest extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  harvestId?: mongoose.Types.ObjectId;
  cropName: string;
  dryingMethod: DryingMethod;
  initialMoisturePercent: number;
  finalMoisturePercent: number;
  foreignMatterPercent: number;
  brokenGrainPercent: number;
  netMarketableWeightQuintals: number;
  cleaningLossPercent: number;
  qualityCertificateGenerated: boolean;
  status: ConditioningStatus;
  certificateNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostHarvestSchema = new Schema<IPostHarvest>(
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
    harvestId: {
      type: Schema.Types.ObjectId,
      ref: 'HarvestRecord',
      index: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    dryingMethod: {
      type: String,
      enum: ['tarpaulin_sun_drying', 'mechanical_dryer', 'solar_tunnel'],
      default: 'tarpaulin_sun_drying',
    },
    initialMoisturePercent: {
      type: Number,
      required: true,
      default: 19.5,
    },
    finalMoisturePercent: {
      type: Number,
      required: true,
      default: 13.0,
    },
    foreignMatterPercent: {
      type: Number,
      required: true,
      default: 0.8,
    },
    brokenGrainPercent: {
      type: Number,
      required: true,
      default: 1.2,
    },
    netMarketableWeightQuintals: {
      type: Number,
      required: true,
      min: 0,
    },
    cleaningLossPercent: {
      type: Number,
      required: true,
      default: 2.0,
    },
    qualityCertificateGenerated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['drying', 'conditioning', 'certified', 'dispatched_to_silo'],
      default: 'conditioning',
      index: true,
    },
    certificateNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'post_harvest_records',
  }
);

export const PostHarvestModel: Model<IPostHarvest> =
  mongoose.models.PostHarvest ||
  mongoose.model<IPostHarvest>('PostHarvest', PostHarvestSchema);
