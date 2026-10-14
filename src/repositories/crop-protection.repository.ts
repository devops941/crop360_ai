import { BaseRepository } from './base.repository';
import { CropProtectionModel, ICropProtection } from '@/models/crop-protection.model';

export class CropProtectionRepository extends BaseRepository<ICropProtection> {
  constructor() {
    super(CropProtectionModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<ICropProtection[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('detectionId', 'pestDiseaseName severityLevel confidenceScorePercent')
      .exec();
  }

  async findByFarm(farmId: string): Promise<ICropProtection[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ createdAt: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .populate('detectionId', 'pestDiseaseName severityLevel')
      .exec();
  }

  async updateStatus(id: string, sprayStatus: string, completedDate?: Date): Promise<ICropProtection | null> {
    await this.ensureConnection();
    const update: Record<string, unknown> = { sprayStatus };
    if (completedDate) update.completedDate = completedDate;
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}

export const cropProtectionRepository = new CropProtectionRepository();
