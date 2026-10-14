import mongoose, { Document, Model, Schema } from 'mongoose';
import { UserRole, AuthProvider } from '@/types';

export interface IUserDoc extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  googleId?: string;
  avatarUrl?: string;
  phone?: string;
  role: UserRole;
  location?: {
    state?: string;
    district?: string;
  };
  landSizeAcres?: number;
  preferredLanguage?: 'en' | 'ta' | 'hi';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDoc>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['farmer', 'fpo_admin', 'agronomist', 'admin'],
      default: 'farmer',
      index: true,
    },
    location: {
      state: { type: String, trim: true },
      district: { type: String, trim: true },
    },
    landSizeAcres: {
      type: Number,
      min: [0, 'Land size cannot be negative'],
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ta', 'hi'],
      default: 'ta',
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUserDoc> =
  mongoose.models.User || mongoose.model<IUserDoc>('User', userSchema);
