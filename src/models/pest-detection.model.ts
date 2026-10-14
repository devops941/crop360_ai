import mongoose, { Document, Model, Schema } from 'mongoose';

export type PestCategory =
  | 'insect_pest'
  | 'fungal_disease'
  | 'bacterial_disease'
  | 'viral_disease'
  | 'nutrient_deficiency';

export type SeverityLevel = 'mild' | 'moderate' | 'critical';
export type OutbreakStatus = 'active' | 'under_treatment' | 'resolved';

export interface IPestDetection extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  sowingId?: mongoose.Types.ObjectId;
  cropName: string;
  detectedCategory: PestCategory;
  pestDiseaseName: string;
  scientificName?: string;
  confidenceScorePercent: number;
  affectedPlantParts: string[];
  severityLevel: SeverityLevel;
  economicThresholdLevelETL: string;
  symptomsDescription?: string;
  photoUrl?: string;
  status: OutbreakStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PestDetectionSchema = new Schema<IPestDetection>(
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
    detectedCategory: {
      type: String,
      enum: ['insect_pest', 'fungal_disease', 'bacterial_disease', 'viral_disease', 'nutrient_deficiency'],
      default: 'insect_pest',
      required: true,
    },
    pestDiseaseName: {
      type: String,
      required: true,
      trim: true,
    },
    scientificName: {
      type: String,
      trim: true,
    },
    confidenceScorePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 90,
    },
    affectedPlantParts: {
      type: [String],
      default: ['leaf'],
    },
    severityLevel: {
      type: String,
      enum: ['mild', 'moderate', 'critical'],
      default: 'moderate',
    },
    economicThresholdLevelETL: {
      type: String,
      required: true,
      default: '5-10 nymphs per hill / 5% leaves affected',
    },
    symptomsDescription: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'under_treatment', 'resolved'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'pest_detections',
  }
);

export const PestDetectionModel: Model<IPestDetection> =
  mongoose.models.PestDetection || mongoose.model<IPestDetection>('PestDetection', PestDetectionSchema);
