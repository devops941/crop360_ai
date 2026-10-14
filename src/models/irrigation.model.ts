import mongoose, { Document, Model, Schema } from 'mongoose';

export type IrrigationMethod = 'drip' | 'sprinkler' | 'flood' | 'furrow';
export type IrrigationStatus = 'pending' | 'completed' | 'delayed_due_to_rain';

export interface IIrrigationSchedule extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  sowingId?: mongoose.Types.ObjectId;
  cropName: string;
  soilMoisturePercent: number;
  cropCoefficientKc: number;
  referenceEtMm: number;
  calculatedWaterRequirementLitersPerAcre: number;
  irrigationMethod: IrrigationMethod;
  pumpDischargeRateLph: number;
  scheduledRunTimeMinutes: number;
  scheduledDate: Date;
  status: IrrigationStatus;
  completedDate?: Date;
  waterMeterReadingLiters?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IrrigationScheduleSchema = new Schema<IIrrigationSchedule>(
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
    soilMoisturePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    cropCoefficientKc: {
      type: Number,
      required: true,
      default: 0.85,
    },
    referenceEtMm: {
      type: Number,
      required: true,
      default: 4.5,
    },
    calculatedWaterRequirementLitersPerAcre: {
      type: Number,
      required: true,
    },
    irrigationMethod: {
      type: String,
      enum: ['drip', 'sprinkler', 'flood', 'furrow'],
      default: 'drip',
    },
    pumpDischargeRateLph: {
      type: Number,
      required: true,
      default: 12000,
    },
    scheduledRunTimeMinutes: {
      type: Number,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'delayed_due_to_rain'],
      default: 'pending',
      index: true,
    },
    completedDate: Date,
    waterMeterReadingLiters: Number,
    notes: String,
  },
  {
    timestamps: true,
    collection: 'irrigation_schedules',
  }
);

export const IrrigationScheduleModel: Model<IIrrigationSchedule> =
  mongoose.models.IrrigationSchedule ||
  mongoose.model<IIrrigationSchedule>('IrrigationSchedule', IrrigationScheduleSchema);
