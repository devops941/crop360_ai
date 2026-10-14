import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISoilParameters {
  pH: number; // 3.5 - 10.5
  electricalConductivity: number; // dS/m (EC)
  organicCarbon: number; // % (OC)
  nitrogen: number; // kg/ha (N)
  phosphorus: number; // kg/ha (P)
  potassium: number; // kg/ha (K)
  sulphur?: number; // ppm (S)
  zinc?: number; // ppm (Zn)
  boron?: number; // ppm (B)
  iron?: number; // ppm (Fe)
  manganese?: number; // ppm (Mn)
  copper?: number; // ppm (Cu)
}

export type SoilReportStatus = 'pending' | 'analyzed' | 'card_generated' | 'rejected';

export interface ISoilReport extends Document {
  sampleCode: string; // e.g. "SHC-2026-0001"
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  testDate: Date;
  testingLabName: string;
  testingLabCode?: string;
  sourceType: 'manual_entry' | 'lab_pdf' | 'iot_sensor';
  sampleDepthInches: number; // standard: 6-9 inches
  parameters: ISoilParameters;
  status: SoilReportStatus;
  rawPdfUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SoilParametersSchema = new Schema<ISoilParameters>(
  {
    pH: { type: Number, required: true, min: 3.0, max: 11.0 },
    electricalConductivity: { type: Number, required: true, min: 0 },
    organicCarbon: { type: Number, required: true, min: 0, max: 100 },
    nitrogen: { type: Number, required: true, min: 0 },
    phosphorus: { type: Number, required: true, min: 0 },
    potassium: { type: Number, required: true, min: 0 },
    sulphur: { type: Number, min: 0 },
    zinc: { type: Number, min: 0 },
    boron: { type: Number, min: 0 },
    iron: { type: Number, min: 0 },
    manganese: { type: Number, min: 0 },
    copper: { type: Number, min: 0 },
  },
  { _id: false }
);

const SoilReportSchema = new Schema<ISoilReport>(
  {
    sampleCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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
    testDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    testingLabName: {
      type: String,
      required: true,
      trim: true,
    },
    testingLabCode: {
      type: String,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ['manual_entry', 'lab_pdf', 'iot_sensor'],
      default: 'manual_entry',
    },
    sampleDepthInches: {
      type: Number,
      default: 6,
    },
    parameters: {
      type: SoilParametersSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'analyzed', 'card_generated', 'rejected'],
      default: 'pending',
      index: true,
    },
    rawPdfUrl: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'soil_reports',
  }
);

SoilReportSchema.index({ farmerId: 1, testDate: -1 });

export const SoilReport: Model<ISoilReport> =
  mongoose.models.SoilReport || mongoose.model<ISoilReport>('SoilReport', SoilReportSchema);
