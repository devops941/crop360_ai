import { BaseRepository } from './base.repository';
import { InventoryStorageModel, IInventoryStorage } from '@/models/inventory-storage.model';

export class InventoryStorageRepository extends BaseRepository<IInventoryStorage> {
  constructor() {
    super(InventoryStorageModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<IInventoryStorage[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('harvestId', 'cropName varietyName totalHarvestedYieldQuintals')
      .exec();
  }

  async findByFarm(farmId: string): Promise<IInventoryStorage[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ createdAt: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }

  async updateStockStatus(id: string, status: string): Promise<IInventoryStorage | null> {
    await this.ensureConnection();
    return this.model.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }
}

export const inventoryStorageRepository = new InventoryStorageRepository();
