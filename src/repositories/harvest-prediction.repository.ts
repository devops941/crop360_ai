import { BaseRepository } from './base.repository';
import { HarvestPredictionModel, IHarvestPrediction } from '@/models/harvest-prediction.model';

export class HarvestPredictionRepository extends BaseRepository<IHarvestPrediction> {
  constructor() {
    super(HarvestPredictionModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<IHarvestPrediction[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ optimalHarvestStartDate: 1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .exec();
  }

  async findByFarm(farmId: string): Promise<IHarvestPrediction[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ optimalHarvestStartDate: 1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }
}

export const harvestPredictionRepository = new HarvestPredictionRepository();
