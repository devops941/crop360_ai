import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISeedVariety {
  varietyName: string;
  sourceBreeder: string; // e.g. TNAU Coimbatore, IARI New Delhi
  seedCategory: 'certified' | 'foundation' | 'hybrid' | 'traditional_desi';
  germinationRatePercent: number; // e.g. 85%
  seedRatePerAcreKg: string;
  seedTreatmentAdvisory: {
    fungicideTreatment?: string;
    biofertilizerInoculation?: string;
    soakingDurationHours?: number;
  };
  durationDays: string;
  pestResistanceTraits: string[];
}

export interface ISeedSelectionPlan extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  cropName: string;
  selectedVariety: ISeedVariety;
  requiredQuantityKg: number;
  estimatedSeedCostInr: number;
  procurementSource: string; // e.g. State Agri Extension Depot / Krishi Vigyan Kendra
  status: 'recommended' | 'procured' | 'treated' | 'sown';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeedVarietySchema = new Schema<ISeedVariety>(
  {
    varietyName: { type: String, required: true },
    sourceBreeder: { type: String, required: true },
    seedCategory: {
      type: String,
      enum: ['certified', 'foundation', 'hybrid', 'traditional_desi'],
      required: true,
    },
    germinationRatePercent: { type: Number, required: true },
    seedRatePerAcreKg: { type: String, required: true },
    seedTreatmentAdvisory: {
      fungicideTreatment: String,
      biofertilizerInoculation: String,
      soakingDurationHours: Number,
    },
    durationDays: { type: String, required: true },
    pestResistanceTraits: [{ type: String }],
  },
  { _id: false }
);

const SeedSelectionPlanSchema = new Schema<ISeedSelectionPlan>(
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
    selectedVariety: {
      type: SeedVarietySchema,
      required: true,
    },
    requiredQuantityKg: {
      type: Number,
      required: true,
    },
    estimatedSeedCostInr: {
      type: Number,
      required: true,
    },
    procurementSource: {
      type: String,
      default: 'Primary Agricultural Cooperative Society (PACS) / KVK',
    },
    status: {
      type: String,
      enum: ['recommended', 'procured', 'treated', 'sown'],
      default: 'recommended',
      index: true,
    },
    notes: String,
  },
  {
    timestamps: true,
    collection: 'seed_selection_plans',
  }
);

export const SeedSelectionPlan: Model<ISeedSelectionPlan> =
  mongoose.models.SeedSelectionPlan ||
  mongoose.model<ISeedSelectionPlan>('SeedSelectionPlan', SeedSelectionPlanSchema);
