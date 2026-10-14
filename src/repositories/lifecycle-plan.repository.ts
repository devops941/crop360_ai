import { BaseRepository } from './base.repository';
import { LifecyclePlanModel, ILifecyclePlan } from '@/models/lifecycle-plan.model';

export class LifecyclePlanRepository extends BaseRepository<ILifecyclePlan> {
  constructor() {
    super(LifecyclePlanModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<ILifecyclePlan[]> {
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

  async findByFarm(farmId: string): Promise<ILifecyclePlan[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ createdAt: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }
}

export const lifecyclePlanRepository = new LifecyclePlanRepository();
