import { BaseRepository } from './base.repository';
import { PostHarvestModel, IPostHarvest } from '@/models/post-harvest.model';

export class PostHarvestRepository extends BaseRepository<IPostHarvest> {
  constructor() {
    super(PostHarvestModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<IPostHarvest[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('harvestId', 'cropName varietyName totalHarvestedYieldQuintals moistureAtHarvestPercent')
      .exec();
  }

  async findByFarm(farmId: string): Promise<IPostHarvest[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ createdAt: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }

  async updateConditioningStatus(id: string, status: string, certificateNumber?: string): Promise<IPostHarvest | null> {
    await this.ensureConnection();
    const update: Record<string, unknown> = { status };
    if (certificateNumber) {
      update.certificateNumber = certificateNumber;
      update.qualityCertificateGenerated = true;
    }
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}

export const postHarvestRepository = new PostHarvestRepository();
