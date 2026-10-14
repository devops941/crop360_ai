import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICropSuitabilityScore {
  cropName: string;
  botanicalName?: string;
  season: 'kharif' | 'rabi' | 'zaid' | 'year_round';
  category: 'cereal' | 'pulse' | 'oilseed' | 'commercial' | 'horticulture' | 'vegetable';
  suitabilityScore: number; // 0 - 100
  suitabilityGrade: 'highly_suitable' | 'moderately_suitable' | 'marginally_suitable' | 'not_recommended';
  expectedYieldRangeQuintalsPerAcre: string;
  estimatedGrossIncomePerAcreInr: number;
  waterRequirementLevel: 'low' | 'moderate' | 'high';
  limitingFactors: string[];
  agronomicAdvantages: string[];
}

export interface ICropRecommendationPlan extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  soilReportId?: mongoose.Types.ObjectId;
  targetSeason: 'kharif' | 'rabi' | 'zaid' | 'annual';
  targetYear: number;
  marketPriceTrendsSummary: string;
  recommendations: ICropSuitabilityScore[];
  selectedCrop?: string;
  status: 'draft' | 'confirmed' | 'in_cultivation' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CropSuitabilityScoreSchema = new Schema<ICropSuitabilityScore>(
  {
    cropName: { type: String, required: true },
    botanicalName: { type: String },
    season: {
      type: String,
      enum: ['kharif', 'rabi', 'zaid', 'year_round'],
      required: true,
    },
    category: {
      type: String,
      enum: ['cereal', 'pulse', 'oilseed', 'commercial', 'horticulture', 'vegetable'],
      required: true,
    },
    suitabilityScore: { type: Number, required: true, min: 0, max: 100 },
    suitabilityGrade: {
      type: String,
      enum: ['highly_suitable', 'moderately_suitable', 'marginally_suitable', 'not_recommended'],
      required: true,
    },
    expectedYieldRangeQuintalsPerAcre: { type: String, required: true },
    estimatedGrossIncomePerAcreInr: { type: Number, required: true },
    waterRequirementLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true,
    },
    limitingFactors: [{ type: String }],
    agronomicAdvantages: [{ type: String }],
  },
  { _id: false }
);

const CropRecommendationPlanSchema = new Schema<ICropRecommendationPlan>(
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
    soilReportId: {
      type: Schema.Types.ObjectId,
      ref: 'SoilReport',
    },
    targetSeason: {
      type: String,
      enum: ['kharif', 'rabi', 'zaid', 'annual'],
      required: true,
      default: 'kharif',
    },
    targetYear: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    marketPriceTrendsSummary: {
      type: String,
      default: 'Stable APMC mandi prices with good local terminal demand',
    },
    recommendations: [CropSuitabilityScoreSchema],
    selectedCrop: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'in_cultivation', 'completed'],
      default: 'draft',
      index: true,
    },
    notes: { type: String },
  },
  {
    timestamps: true,
    collection: 'crop_recommendation_plans',
  }
);

export const CropRecommendationPlan: Model<ICropRecommendationPlan> =
  mongoose.models.CropRecommendationPlan ||
  mongoose.model<ICropRecommendationPlan>('CropRecommendationPlan', CropRecommendationPlanSchema);
