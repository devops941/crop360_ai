import { BaseRepository } from './base.repository';
import { HarvestRecordModel, IHarvestRecord } from '@/models/harvest-record.model';

export class HarvestRecordRepository extends BaseRepository<IHarvestRecord> {
  constructor() {
    super(HarvestRecordModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<IHarvestRecord[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ harvestDate: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .exec();
  }

  async findByFarm(farmId: string): Promise<IHarvestRecord[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ harvestDate: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }
}

export const harvestRecordRepository = new HarvestRecordRepository();
