import mongoose, { Document, Model, Schema } from 'mongoose';

export type PriceTrend = 'upward' | 'stable' | 'downward';

export interface IMarketPrice extends Document {
  commodity: string;
  variety: string;
  mandiName: string;
  district: string;
  state: string;
  minPriceInrPerQuintal: number;
  modalPriceInrPerQuintal: number;
  maxPriceInrPerQuintal: number;
  governmentMspInrPerQuintal: number;
  priceTrend: PriceTrend;
  recordedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarketPriceSchema = new Schema<IMarketPrice>(
  {
    commodity: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    variety: {
      type: String,
      required: true,
      trim: true,
    },
    mandiName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
      trim: true,
    },
    minPriceInrPerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    modalPriceInrPerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPriceInrPerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    governmentMspInrPerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    priceTrend: {
      type: String,
      enum: ['upward', 'stable', 'downward'],
      default: 'stable',
    },
    recordedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'market_prices',
  }
);

export const MarketPriceModel: Model<IMarketPrice> =
  mongoose.models.MarketPrice ||
  mongoose.model<IMarketPrice>('MarketPrice', MarketPriceSchema);
