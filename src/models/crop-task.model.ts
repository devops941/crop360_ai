import mongoose, { Document, Model, Schema } from 'mongoose';

export type TaskCategory =
  | 'land_prep'
  | 'irrigation'
  | 'fertilization'
  | 'weeding'
  | 'spraying'
  | 'harvest'
  | 'general';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ICropTask extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  taskTitle: string;
  taskCategory: TaskCategory;
  scheduledDate: Date;
  assignedLaborCount: number;
  estimatedLaborCostInr: number;
  status: TaskStatus;
  priority: TaskPriority;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CropTaskSchema = new Schema<ICropTask>(
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
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'LifecyclePlan',
      index: true,
    },
    taskTitle: {
      type: String,
      required: true,
      trim: true,
    },
    taskCategory: {
      type: String,
      enum: ['land_prep', 'irrigation', 'fertilization', 'weeding', 'spraying', 'harvest', 'general'],
      default: 'general',
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    assignedLaborCount: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
    },
    estimatedLaborCostInr: {
      type: Number,
      required: true,
      default: 800,
      min: 0,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done', 'blocked'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    completedDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'crop_tasks',
  }
);

export const CropTaskModel: Model<ICropTask> =
  mongoose.models.CropTask || mongoose.model<ICropTask>('CropTask', CropTaskSchema);
