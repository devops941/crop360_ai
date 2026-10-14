import mongoose, { Document, Model, Schema } from 'mongoose';

export type VehicleType = 'tractor_trailer' | 'mini_truck_ace' | 'lorry_10_wheel' | 'pickup_truck';
export type DeliveryStatus = 'scheduled' | 'in_transit' | 'unloaded_at_mandi';

export interface ILogistics extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  vehicleType: VehicleType;
  vehicleRegistrationNo: string;
  driverName: string;
  driverPhone: string;
  pickupLocation: string;
  destinationMandi: string;
  distanceKm: number;
  freightChargeInr: number;
  dispatchTimestamp: Date;
  deliveryStatus: DeliveryStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LogisticsSchema = new Schema<ILogistics>(
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
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'TradeOrder',
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['tractor_trailer', 'mini_truck_ace', 'lorry_10_wheel', 'pickup_truck'],
      default: 'mini_truck_ace',
    },
    vehicleRegistrationNo: {
      type: String,
      required: true,
      trim: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      required: true,
      trim: true,
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    destinationMandi: {
      type: String,
      required: true,
      trim: true,
    },
    distanceKm: {
      type: Number,
      required: true,
      min: 1,
    },
    freightChargeInr: {
      type: Number,
      required: true,
      min: 0,
    },
    dispatchTimestamp: {
      type: Date,
      default: Date.now,
    },
    deliveryStatus: {
      type: String,
      enum: ['scheduled', 'in_transit', 'unloaded_at_mandi'],
      default: 'scheduled',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'logistics_dispatches',
  }
);

export const LogisticsModel: Model<ILogistics> =
  mongoose.models.Logistics ||
  mongoose.model<ILogistics>('Logistics', LogisticsSchema);
