import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INutrientAnalysis {
  parameter: string;
  value: number;
  unit: string;
  benchmarkRange: string;
  rating: 'deficient' | 'low' | 'medium' | 'optimal' | 'high' | 'excessive';
  deviationPercentage: number;
}

export interface IRemediationPlan {
  category: 'soil_amendment' | 'primary_fertilizer' | 'micronutrient' | 'organic_matter';
  action: string;
  recommendation: string;
  dosagePerAcre: string;
  timing: string;
  priority: 'immediate' | 'recommended' | 'optional';
}

export interface ISoilAnalysisResult extends Document {
  reportId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  analysisDate: Date;
  overallHealthScore: number; // 0 - 100
  fertilityRating: 'poor' | 'moderate' | 'good' | 'exceptional';
  soilPhCategory: 'strongly_acidic' | 'moderately_acidic' | 'neutral' | 'moderately_alkaline' | 'strongly_alkaline';
  remediationSummary: string;
  nutrients: INutrientAnalysis[];
  actionPlan: IRemediationPlan[];
  vernacularSummary: {
    ta?: string; // Tamil
    hi?: string; // Hindi
    en: string;  // English
  };
  recommendedNextSampleMonth: string;
  createdAt: Date;
  updatedAt: Date;
}

const NutrientAnalysisSchema = new Schema<INutrientAnalysis>(
  {
    parameter: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    benchmarkRange: { type: String, required: true },
    rating: {
      type: String,
      enum: ['deficient', 'low', 'medium', 'optimal', 'high', 'excessive'],
      required: true,
    },
    deviationPercentage: { type: Number, default: 0 },
  },
  { _id: false }
);

const RemediationPlanSchema = new Schema<IRemediationPlan>(
  {
    category: {
      type: String,
      enum: ['soil_amendment', 'primary_fertilizer', 'micronutrient', 'organic_matter'],
      required: true,
    },
    action: { type: String, required: true },
    recommendation: { type: String, required: true },
    dosagePerAcre: { type: String, required: true },
    timing: { type: String, required: true },
    priority: {
      type: String,
      enum: ['immediate', 'recommended', 'optional'],
      default: 'recommended',
    },
  },
  { _id: false }
);

const SoilAnalysisResultSchema = new Schema<ISoilAnalysisResult>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'SoilReport',
      required: true,
      unique: true,
      index: true,
    },
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
    analysisDate: {
      type: Date,
      default: Date.now,
    },
    overallHealthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    fertilityRating: {
      type: String,
      enum: ['poor', 'moderate', 'good', 'exceptional'],
      required: true,
    },
    soilPhCategory: {
      type: String,
      enum: ['strongly_acidic', 'moderately_acidic', 'neutral', 'moderately_alkaline', 'strongly_alkaline'],
      required: true,
    },
    remediationSummary: {
      type: String,
      required: true,
    },
    nutrients: [NutrientAnalysisSchema],
    actionPlan: [RemediationPlanSchema],
    vernacularSummary: {
      ta: String,
      hi: String,
      en: { type: String, required: true },
    },
    recommendedNextSampleMonth: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'soil_analysis_results',
  }
);

export const SoilAnalysisResult: Model<ISoilAnalysisResult> =
  mongoose.models.SoilAnalysisResult ||
  mongoose.model<ISoilAnalysisResult>('SoilAnalysisResult', SoilAnalysisResultSchema);
