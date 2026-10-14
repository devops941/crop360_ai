import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISoilHealthCard extends Document {
  cardNumber: string; // e.g. "SHC-CRD-2026-0001"
  reportId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  issuedDate: Date;
  expiryDate: Date; // standard: 3 years
  qrVerificationCode: string;
  cycle: string; // e.g. "Cycle 2026-2029"
  cardDataSnapshot: {
    farmerName: string;
    farmerCode: string;
    phone: string;
    district: string;
    state: string;
    parcelName: string;
    surveyNumber: string;
    totalAreaAcres: number;
    soilType: string;
    overallHealthScore: number;
    fertilityRating: string;
    phValue: number;
    ecValue: number;
    ocValue: number;
    nitrogenValue: number;
    phosphorusValue: number;
    potassiumValue: number;
    topRecommendations: string[];
  };
  status: 'active' | 'superseded' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

const SoilHealthCardSchema = new Schema<ISoilHealthCard>(
  {
    cardNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'SoilReport',
      required: true,
      unique: true,
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
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    qrVerificationCode: {
      type: String,
      required: true,
    },
    cycle: {
      type: String,
      default: 'Cycle 2026-2029',
    },
    cardDataSnapshot: {
      farmerName: { type: String, required: true },
      farmerCode: { type: String, required: true },
      phone: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      parcelName: { type: String, required: true },
      surveyNumber: { type: String, required: true },
      totalAreaAcres: { type: Number, required: true },
      soilType: { type: String, required: true },
      overallHealthScore: { type: Number, required: true },
      fertilityRating: { type: String, required: true },
      phValue: { type: Number, required: true },
      ecValue: { type: Number, required: true },
      ocValue: { type: Number, required: true },
      nitrogenValue: { type: Number, required: true },
      phosphorusValue: { type: Number, required: true },
      potassiumValue: { type: Number, required: true },
      topRecommendations: [{ type: String }],
    },
    status: {
      type: String,
      enum: ['active', 'superseded', 'revoked'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'soil_health_cards',
  }
);

export const SoilHealthCard: Model<ISoilHealthCard> =
  mongoose.models.SoilHealthCard ||
  mongoose.model<ISoilHealthCard>('SoilHealthCard', SoilHealthCardSchema);
