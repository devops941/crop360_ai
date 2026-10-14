import { BaseRepository } from './base.repository';
import { NutrientManagementModel, INutrientManagement } from '@/models/nutrient-management.model';

export class NutrientManagementRepository extends BaseRepository<INutrientManagement> {
  constructor() {
    super(NutrientManagementModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<INutrientManagement[]> {
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
}

export const nutrientManagementRepository = new NutrientManagementRepository();
