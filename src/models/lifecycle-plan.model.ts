import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILifecyclePhase {
  phaseName: string;
  startDay: number;
  endDay: number;
  criticalMilestones: string[];
  estimatedBudgetSharePercent: number;
}

export type LifecyclePlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface ILifecyclePlan extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  sowingId?: mongoose.Types.ObjectId;
  cropName: string;
  varietyName: string;
  sowingDate: Date;
  targetHarvestDate: Date;
  totalDurationDays: number;
  phases: ILifecyclePhase[];
  riskFactors: string[];
  status: LifecyclePlanStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifecyclePhaseSchema = new Schema<ILifecyclePhase>(
  {
    phaseName: { type: String, required: true },
    startDay: { type: Number, required: true },
    endDay: { type: Number, required: true },
    criticalMilestones: { type: [String], default: [] },
    estimatedBudgetSharePercent: { type: Number, required: true },
  },
  { _id: false }
);

const LifecyclePlanSchema = new Schema<ILifecyclePlan>(
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
    sowingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    targetHarvestDate: {
      type: Date,
      required: true,
    },
    totalDurationDays: {
      type: Number,
      required: true,
      default: 120,
    },
    phases: {
      type: [LifecyclePhaseSchema],
      default: [],
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'lifecycle_plans',
  }
);

export const LifecyclePlanModel: Model<ILifecyclePlan> =
  mongoose.models.LifecyclePlan || mongoose.model<ILifecyclePlan>('LifecyclePlan', LifecyclePlanSchema);
