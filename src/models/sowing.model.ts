import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISowingRecord extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  cropName: string;
  varietyName: string;
  sowingDate: Date;
  plantingMethod: 'direct_seeding' | 'transplanting' | 'dibbling' | 'broadcasting' | 'drip_fertigation_line';
  spacingCm: {
    rowToRowCm: number;
    plantToPlantCm: number;
  };
  plantPopulationPerAcre: number;
  nurseryAgeDays?: number; // for transplanted rice/vegetables
  targetHarvestDateEstimated: Date;
  actualSeedRateUsedKg: number;
  depthOfSowingCm: number;
  status: 'planned' | 'sown' | 'germination_verified' | 'failed_resown';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SowingRecordSchema = new Schema<ISowingRecord>(
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
    varietyName: {
      type: String,
      required: true,
    },
    sowingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    plantingMethod: {
      type: String,
      enum: ['direct_seeding', 'transplanting', 'dibbling', 'broadcasting', 'drip_fertigation_line'],
      default: 'transplanting',
    },
    spacingCm: {
      rowToRowCm: { type: Number, required: true },
      plantToPlantCm: { type: Number, required: true },
    },
    plantPopulationPerAcre: {
      type: Number,
      required: true,
    },
    nurseryAgeDays: {
      type: Number,
    },
    targetHarvestDateEstimated: {
      type: Date,
      required: true,
    },
    actualSeedRateUsedKg: {
      type: Number,
      required: true,
    },
    depthOfSowingCm: {
      type: Number,
      default: 3,
    },
    status: {
      type: String,
      enum: ['planned', 'sown', 'germination_verified', 'failed_resown'],
      default: 'sown',
      index: true,
    },
    notes: String,
  },
  {
    timestamps: true,
    collection: 'sowing_records',
  }
);

export const SowingRecord: Model<ISowingRecord> =
  mongoose.models.SowingRecord ||
  mongoose.model<ISowingRecord>('SowingRecord', SowingRecordSchema);
