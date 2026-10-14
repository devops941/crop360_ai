import { BaseRepository } from './base.repository';
import { PestDetectionModel, IPestDetection } from '@/models/pest-detection.model';

export class PestDetectionRepository extends BaseRepository<IPestDetection> {
  constructor() {
    super(PestDetectionModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<IPestDetection[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .exec();
  }

  async findByFarm(farmId: string): Promise<IPestDetection[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ createdAt: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }

  async updateStatus(id: string, status: string): Promise<IPestDetection | null> {
    await this.ensureConnection();
    return this.model.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }
}

export const pestDetectionRepository = new PestDetectionRepository();
