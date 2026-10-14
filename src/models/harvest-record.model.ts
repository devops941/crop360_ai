import mongoose, { Document, Model, Schema } from 'mongoose';

export type HarvestMethod = 'manual_sickle' | 'combine_harvester' | 'mini_reaper';
export type GrainQualityGrade = 'grade_a_faq' | 'grade_b' | 'premium_organic';

export interface IHarvestRecord extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  sowingId?: mongoose.Types.ObjectId;
  cropName: string;
  varietyName: string;
  harvestDate: Date;
  harvestMethod: HarvestMethod;
  totalHarvestedYieldQuintals: number;
  yieldPerAcreQuintals: number;
  moistureAtHarvestPercent: number;
  grainQualityGrade: GrainQualityGrade;
  bagCount: number;
  machineryRentalCostInr: number;
  totalHarvestCostInr: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HarvestRecordSchema = new Schema<IHarvestRecord>(
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
    harvestDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    harvestMethod: {
      type: String,
      enum: ['manual_sickle', 'combine_harvester', 'mini_reaper'],
      default: 'combine_harvester',
    },
    totalHarvestedYieldQuintals: {
      type: Number,
      required: true,
      min: 0,
    },
    yieldPerAcreQuintals: {
      type: Number,
      required: true,
      min: 0,
    },
    moistureAtHarvestPercent: {
      type: Number,
      required: true,
      default: 19,
    },
    grainQualityGrade: {
      type: String,
      enum: ['grade_a_faq', 'grade_b', 'premium_organic'],
      default: 'grade_a_faq',
    },
    bagCount: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
    },
    machineryRentalCostInr: {
      type: Number,
      default: 2500,
      min: 0,
    },
    totalHarvestCostInr: {
      type: Number,
      required: true,
      default: 4500,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'harvest_records',
  }
);

export const HarvestRecordModel: Model<IHarvestRecord> =
  mongoose.models.HarvestRecord ||
  mongoose.model<IHarvestRecord>('HarvestRecord', HarvestRecordSchema);
