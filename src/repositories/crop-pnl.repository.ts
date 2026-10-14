import { BaseRepository } from './base.repository';
import { CropPnlModel, ICropPnl } from '@/models/crop-pnl.model';

export class CropPnlRepository extends BaseRepository<ICropPnl> {
  constructor() {
    super(CropPnlModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<ICropPnl[]> {
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

  async findByFarm(farmId: string): Promise<ICropPnl[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ createdAt: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }
}

export const cropPnlRepository = new CropPnlRepository();
