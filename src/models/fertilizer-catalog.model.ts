import mongoose, { Document, Model, Schema } from 'mongoose';

export type FertilizerCategory =
  | 'primary_npk'
  | 'secondary_micronutrient'
  | 'water_soluble'
  | 'bio_organic'
  | 'soil_amendment';

export interface IFertilizerItem extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: FertilizerCategory;
  npkRatio?: string;
  manufacturer: string;
  bagSizeKg: number;
  unit: 'bag' | 'kg' | 'liter' | 'bottle';
  pricePerUnitInr: number;
  subsidizedPriceInr?: number;
  stockAvailableUnits: number;
  suitableCrops: string[];
  applicationMethod: 'broadcasting' | 'fertigation' | 'foliar_spray' | 'soil_incorporation' | 'seed_treatment';
  dosageGuide: string;
  batchNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FertilizerItemSchema = new Schema<IFertilizerItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: ['primary_npk', 'secondary_micronutrient', 'water_soluble', 'bio_organic', 'soil_amendment'],
      default: 'primary_npk',
      index: true,
    },
    npkRatio: { type: String, default: '' },
    manufacturer: { type: String, required: true, trim: true },
    bagSizeKg: { type: Number, required: true, default: 50 },
    unit: {
      type: String,
      enum: ['bag', 'kg', 'liter', 'bottle'],
      default: 'bag',
    },
    pricePerUnitInr: { type: Number, required: true },
    subsidizedPriceInr: { type: Number },
    stockAvailableUnits: { type: Number, required: true, default: 50 },
    suitableCrops: [{ type: String }],
    applicationMethod: {
      type: String,
      enum: ['broadcasting', 'fertigation', 'foliar_spray', 'soil_incorporation', 'seed_treatment'],
      default: 'broadcasting',
    },
    dosageGuide: { type: String, default: '' },
    batchNumber: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'fertilizer_catalog',
  }
);

FertilizerItemSchema.index({ userId: 1, name: 1 });
FertilizerItemSchema.index({ userId: 1, category: 1 });

if (mongoose.models.FertilizerItem) {
  delete mongoose.models.FertilizerItem;
}

export const FertilizerItem: Model<IFertilizerItem> =
  mongoose.model<IFertilizerItem>('FertilizerItem', FertilizerItemSchema);
