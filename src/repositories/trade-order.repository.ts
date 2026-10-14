import { BaseRepository } from './base.repository';
import { TradeOrderModel, ITradeOrder } from '@/models/trade-order.model';

export class TradeOrderRepository extends BaseRepository<ITradeOrder> {
  constructor() {
    super(TradeOrderModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<ITradeOrder[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ contractDate: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('inventoryId', 'lotNumber storageLocationName bagsStored')
      .exec();
  }

  async findByFarm(farmId: string): Promise<ITradeOrder[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ contractDate: -1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }

  async updateOrderStatus(id: string, orderStatus: string, paymentStatus?: string): Promise<ITradeOrder | null> {
    await this.ensureConnection();
    const update: Record<string, unknown> = { orderStatus };
    if (paymentStatus) update.paymentStatus = paymentStatus;
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}

export const tradeOrderRepository = new TradeOrderRepository();
