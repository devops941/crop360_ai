import { BaseRepository } from './base.repository';
import { CropGrowthModel, ICropGrowth } from '@/models/crop-growth.model';

export class CropGrowthRepository extends BaseRepository<ICropGrowth> {
  constructor() {
    super(CropGrowthModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<ICropGrowth[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ observationDate: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .exec();
  }

  async findByFarm(farmId: string): Promise<ICropGrowth[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ observationDate: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }
}

export const cropGrowthRepository = new CropGrowthRepository();
