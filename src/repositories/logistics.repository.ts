import { BaseRepository } from './base.repository';
import { LogisticsModel, ILogistics } from '@/models/logistics.model';

export class LogisticsRepository extends BaseRepository<ILogistics> {
  constructor() {
    super(LogisticsModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<ILogistics[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ dispatchTimestamp: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('orderId', 'buyerName commodity agreedPricePerQuintalInr quantityQuintals')
      .exec();
  }

  async updateDeliveryStatus(id: string, deliveryStatus: string): Promise<ILogistics | null> {
    await this.ensureConnection();
    return this.model.findByIdAndUpdate(id, { deliveryStatus }, { new: true }).exec();
  }
}

export const logisticsRepository = new LogisticsRepository();
