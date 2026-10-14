import mongoose, { Document, Model, Schema } from 'mongoose';

export type ShatteringRisk = 'low' | 'medium' | 'severe';
export type ReadinessStatus = 'approaching' | 'optimal_window' | 'overdue';

export interface IHarvestPrediction extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  sowingId?: mongoose.Types.ObjectId;
  cropName: string;
  varietyName: string;
  accumulatedGDD: number;
  grainMoisturePercent: number;
  visualMaturityIndexPercent: number;
  optimalHarvestStartDate: Date;
  optimalHarvestEndDate: Date;
  predictedYieldQuintalsPerAcre: number;
  shatteringRiskRating: ShatteringRisk;
  readinessStatus: ReadinessStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HarvestPredictionSchema = new Schema<IHarvestPrediction>(
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
    accumulatedGDD: {
      type: Number,
      required: true,
      default: 1950,
    },
    grainMoisturePercent: {
      type: Number,
      required: true,
      min: 5,
      max: 40,
      default: 19.5,
    },
    visualMaturityIndexPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 85,
    },
    optimalHarvestStartDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    optimalHarvestEndDate: {
      type: Date,
      required: true,
    },
    predictedYieldQuintalsPerAcre: {
      type: Number,
      required: true,
      default: 26.5,
    },
    shatteringRiskRating: {
      type: String,
      enum: ['low', 'medium', 'severe'],
      default: 'low',
    },
    readinessStatus: {
      type: String,
      enum: ['approaching', 'optimal_window', 'overdue'],
      default: 'optimal_window',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'harvest_predictions',
  }
);

export const HarvestPredictionModel: Model<IHarvestPrediction> =
  mongoose.models.HarvestPrediction ||
  mongoose.model<IHarvestPrediction>('HarvestPrediction', HarvestPredictionSchema);
