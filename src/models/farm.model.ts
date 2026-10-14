import mongoose, { Document, Model, Schema } from 'mongoose';

export type SoilClassification =
  'alluvial' | 'black_cotton' | 'red_loam' | 'laterite' | 'sandy_loam' | 'clayey';

export type IrrigationType = 'borewell' | 'canal' | 'open_well' | 'drip' | 'sprinkler' | 'rainfed';

export interface IFarmDoc extends Document {
  farmerId: mongoose.Types.ObjectId;
  surveyNumber: string;
  parcelName: string;
  totalAreaAcres: number;
  cultivableAreaAcres: number;
  soilType: SoilClassification;
  irrigationSource: IrrigationType;
  waterAvailabilityMonths: number;
  village?: string;
  district: string;
  state: string;
  status: 'active' | 'fallow';
  createdAt: Date;
  updatedAt: Date;
}

const farmSchema = new Schema<IFarmDoc>(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    surveyNumber: {
      type: String,
      required: [true, 'Survey number / Patta is required'],
      trim: true,
      index: true,
    },
    parcelName: {
      type: String,
      default: 'Main Field',
      trim: true,
    },
    totalAreaAcres: {
      type: Number,
      required: true,
      min: [0.1, 'Minimum area is 0.1 acre'],
    },
    cultivableAreaAcres: {
      type: Number,
      required: true,
      min: [0.1, 'Minimum cultivable area is 0.1 acre'],
    },
    soilType: {
      type: String,
      enum: ['alluvial', 'black_cotton', 'red_loam', 'laterite', 'sandy_loam', 'clayey'],
      default: 'alluvial',
    },
    irrigationSource: {
      type: String,
      enum: ['borewell', 'canal', 'open_well', 'drip', 'sprinkler', 'rainfed'],
      default: 'borewell',
    },
    waterAvailabilityMonths: {
      type: Number,
      min: 1,
      max: 12,
      default: 8,
    },
    village: { type: String, trim: true },
    district: { type: String, required: true },
    state: { type: String, default: 'Tamil Nadu' },
    status: {
      type: String,
      enum: ['active', 'fallow'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export const FarmModel: Model<IFarmDoc> =
  mongoose.models.Farm || mongoose.model<IFarmDoc>('Farm', farmSchema);

export { FarmModel as Farm };
