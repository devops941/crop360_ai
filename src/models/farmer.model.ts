import mongoose, { Document, Model, Schema } from 'mongoose';

export type FarmerCategory = 'marginal' | 'small' | 'medium' | 'large';

export interface IFarmerDoc extends Document {
  farmerCode: string;
  name: string;
  phone: string;
  email?: string;
  aadhaarLastFour?: string;
  category: FarmerCategory;
  village?: string;
  panchayat?: string;
  taluk?: string;
  district: string;
  state: string;
  pincode?: string;
  preferredLanguage: 'en' | 'ta' | 'hi';
  status: 'active' | 'inactive';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const farmerSchema = new Schema<IFarmerDoc>(
  {
    farmerCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Farmer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    aadhaarLastFour: {
      type: String,
      maxlength: 4,
      trim: true,
    },
    category: {
      type: String,
      enum: ['marginal', 'small', 'medium', 'large'],
      default: 'small',
    },
    village: { type: String, trim: true },
    panchayat: { type: String, trim: true },
    taluk: { type: String, trim: true },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      default: 'Tamil Nadu',
      trim: true,
    },
    pincode: { type: String, trim: true },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ta', 'hi'],
      default: 'ta',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    createdBy: { type: String },
  },
  {
    timestamps: true,
  }
);

export const FarmerModel: Model<IFarmerDoc> =
  mongoose.models.Farmer || mongoose.model<IFarmerDoc>('Farmer', farmerSchema);

export { FarmerModel as Farmer };
