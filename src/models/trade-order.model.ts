import mongoose, { Document, Model, Schema } from 'mongoose';

export type BuyerType = 'fpo' | 'wholesaler' | 'food_processor' | 'retail_chain' | 'mandi_trader';
export type PaymentStatus = 'advance_paid' | 'escrow' | 'fully_settled';
export type OrderStatus = 'negotiating' | 'confirmed' | 'dispatched' | 'settled';

export interface ITradeOrder extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  inventoryId?: mongoose.Types.ObjectId;
  commodity: string;
  variety: string;
  buyerName: string;
  buyerType: BuyerType;
  buyerContactPhone: string;
  agreedPricePerQuintalInr: number;
  quantityQuintals: number;
  totalSaleAmountInr: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  contractDate: Date;
  invoiceNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TradeOrderSchema = new Schema<ITradeOrder>(
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
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryStorage',
      index: true,
    },
    commodity: {
      type: String,
      required: true,
      trim: true,
    },
    variety: {
      type: String,
      required: true,
      trim: true,
    },
    buyerName: {
      type: String,
      required: true,
      trim: true,
    },
    buyerType: {
      type: String,
      enum: ['fpo', 'wholesaler', 'food_processor', 'retail_chain', 'mandi_trader'],
      default: 'wholesaler',
    },
    buyerContactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    agreedPricePerQuintalInr: {
      type: Number,
      required: true,
      min: 0,
    },
    quantityQuintals: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSaleAmountInr: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['advance_paid', 'escrow', 'fully_settled'],
      default: 'advance_paid',
    },
    orderStatus: {
      type: String,
      enum: ['negotiating', 'confirmed', 'dispatched', 'settled'],
      default: 'confirmed',
      index: true,
    },
    contractDate: {
      type: Date,
      default: Date.now,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'trade_orders',
  }
);

export const TradeOrderModel: Model<ITradeOrder> =
  mongoose.models.TradeOrder ||
  mongoose.model<ITradeOrder>('TradeOrder', TradeOrderSchema);
