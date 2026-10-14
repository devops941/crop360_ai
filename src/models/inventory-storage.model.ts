import mongoose, { Document, Model, Schema } from 'mongoose';

export type StorageType =
  | 'farm_godown'
  | 'cwc_warehouse'
  | 'pacs_storage'
  | 'cold_storage'
  | 'metal_silo';

export type InventoryStatus = 'in_storage' | 'partially_sold' | 'dispatched';

export interface IInventoryStorage extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  harvestId?: mongoose.Types.ObjectId;
  commodity: string;
  variety: string;
  storageType: StorageType;
  lotNumber: string;
  storageLocationName: string;
  bagsStored: number;
  bagWeightKg: number;
  totalQuantityQuintals: number;
  fumigationLastDate?: Date;
  nextFumigationDueDate?: Date;
  warehouseReceiptNumber?: string;
  status: InventoryStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryStorageSchema = new Schema<IInventoryStorage>(
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
    harvestId: {
      type: Schema.Types.ObjectId,
      ref: 'HarvestRecord',
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
    storageType: {
      type: String,
      enum: ['farm_godown', 'cwc_warehouse', 'pacs_storage', 'cold_storage', 'metal_silo'],
      default: 'farm_godown',
    },
    lotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    storageLocationName: {
      type: String,
      required: true,
      trim: true,
    },
    bagsStored: {
      type: Number,
      required: true,
      min: 1,
    },
    bagWeightKg: {
      type: Number,
      required: true,
      default: 50,
    },
    totalQuantityQuintals: {
      type: Number,
      required: true,
      min: 0,
    },
    fumigationLastDate: {
      type: Date,
    },
    nextFumigationDueDate: {
      type: Date,
    },
    warehouseReceiptNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['in_storage', 'partially_sold', 'dispatched'],
      default: 'in_storage',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'inventory_storage',
  }
);

export const InventoryStorageModel: Model<IInventoryStorage> =
  mongoose.models.InventoryStorage ||
  mongoose.model<IInventoryStorage>('InventoryStorage', InventoryStorageSchema);
