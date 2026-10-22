import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISeedCatalogItem extends Document {
  userId: mongoose.Types.ObjectId;
  cropName: string;
  varietyName: string;
  category: 'cereal' | 'pulse' | 'oilseed' | 'commercial' | 'horticulture' | 'vegetable';
  sourceBreeder: string;
  seedCategory: 'certified' | 'foundation' | 'hybrid' | 'traditional_desi';
  germinationRatePercent: number;
  seedRatePerAcreKg: string;
  seedRateKgNumber: number;
  costPerKgInr: number;
  durationDays: string;
  pestResistanceTraits: string[];
  seedTreatmentAdvisory: {
    fungicideTreatment: string;
    biofertilizerInoculation: string;
    soakingDurationHours: number;
  };
  stockAvailableKg?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SeedCatalogItemSchema = new Schema<ISeedCatalogItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cropName: { type: String, required: true, index: true },
    varietyName: { type: String, required: true },
    category: {
      type: String,
      enum: ['cereal', 'pulse', 'oilseed', 'commercial', 'horticulture', 'vegetable'],
      default: 'cereal',
      index: true,
    },
    sourceBreeder: { type: String, required: true },
    seedCategory: {
      type: String,
      enum: ['certified', 'foundation', 'hybrid', 'traditional_desi'],
      default: 'certified',
    },
    germinationRatePercent: { type: Number, required: true, default: 85 },
    seedRatePerAcreKg: { type: String, required: true },
    seedRateKgNumber: { type: Number, required: true },
    costPerKgInr: { type: Number, required: true },
    stockAvailableKg: { type: Number, default: 120 },
    durationDays: { type: String, required: true },
    pestResistanceTraits: [{ type: String }],
    seedTreatmentAdvisory: {
      fungicideTreatment: { type: String, default: '' },
      biofertilizerInoculation: { type: String, default: '' },
      soakingDurationHours: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'seed_catalog',
  }
);

SeedCatalogItemSchema.index({ userId: 1, varietyName: 1 }, { unique: true });
SeedCatalogItemSchema.index({ userId: 1, cropName: 1 });

if (mongoose.models.SeedCatalogItem) {
  delete mongoose.models.SeedCatalogItem;
}

export const SeedCatalogItem: Model<ISeedCatalogItem> =
  mongoose.model<ISeedCatalogItem>('SeedCatalogItem', SeedCatalogItemSchema);
