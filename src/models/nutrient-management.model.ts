import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISplitApplication {
  stage: 'basal' | 'first_top_dress' | 'second_top_dress' | 'panicle_initiation' | 'foliar_spray';
  timingDaysAfterSowing: number;
  fertilizerType: string;
  quantityKgPerAcre: number;
  applicationMethod: 'broadcasting' | 'fertigation' | 'foliar_spray' | 'soil_incorporation';
  status: 'scheduled' | 'applied' | 'skipped';
  appliedDate?: Date;
}

export interface INutrientManagement extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  sowingId?: mongoose.Types.ObjectId;
  cropName: string;
  varietyName: string;
  targetYieldQuintalsPerAcre: number;
  splitApplications: ISplitApplication[];
  totalFertilizerCostEstInr: number;
  organicManureTonnesPerAcre: number;
  status: 'active' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SplitApplicationSchema = new Schema<ISplitApplication>(
  {
    stage: {
      type: String,
      enum: ['basal', 'first_top_dress', 'second_top_dress', 'panicle_initiation', 'foliar_spray'],
      required: true,
    },
    timingDaysAfterSowing: { type: Number, required: true },
    fertilizerType: { type: String, required: true },
    quantityKgPerAcre: { type: Number, required: true },
    applicationMethod: {
      type: String,
      enum: ['broadcasting', 'fertigation', 'foliar_spray', 'soil_incorporation'],
      default: 'broadcasting',
    },
    status: {
      type: String,
      enum: ['scheduled', 'applied', 'skipped'],
      default: 'scheduled',
    },
    appliedDate: Date,
  },
  { _id: false }
);

const NutrientManagementSchema = new Schema<INutrientManagement>(
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
    targetYieldQuintalsPerAcre: {
      type: Number,
      required: true,
      default: 25,
    },
    splitApplications: [SplitApplicationSchema],
    totalFertilizerCostEstInr: {
      type: Number,
      required: true,
      default: 0,
    },
    organicManureTonnesPerAcre: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
      index: true,
    },
    notes: String,
  },
  {
    timestamps: true,
    collection: 'nutrient_management_plans',
  }
);

export const NutrientManagementModel: Model<INutrientManagement> =
  mongoose.models.NutrientManagement ||
  mongoose.model<INutrientManagement>('NutrientManagement', NutrientManagementSchema);
