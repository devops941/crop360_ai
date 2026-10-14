import { BaseRepository } from './base.repository';
import { FarmModel, IFarmDoc } from '@/models/farm.model';

export class FarmRepository extends BaseRepository<IFarmerDocOrFarm> {
  constructor() {
    super(FarmModel as any);
  }

  async findByFarmer(farmerId: string): Promise<IFarmDoc[]> {
    await this.ensureConnection();
    return FarmModel.find({ farmerId }).populate('farmerId', 'name farmerCode phone').exec();
  }

  async findAllWithFarmer(filter: Record<string, unknown> = {}): Promise<any[]> {
    await this.ensureConnection();
    return FarmModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .sort({ createdAt: -1 })
      .exec();
  }
}

type IFarmerDocOrFarm = any;

export const farmRepository = new FarmRepository();
