import { BaseRepository } from './base.repository';
import { MarketPriceModel, IMarketPrice } from '@/models/market-price.model';

export class MarketPriceRepository extends BaseRepository<IMarketPrice> {
  constructor() {
    super(MarketPriceModel);
  }

  async findLatestPrices(filter: Record<string, unknown> = {}, limit = 50): Promise<IMarketPrice[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ recordedDate: -1 })
      .limit(limit)
      .exec();
  }

  async findByCommodity(commodity: string): Promise<IMarketPrice[]> {
    await this.ensureConnection();
    return this.model
      .find({ commodity: new RegExp(`^${commodity}$`, 'i') })
      .sort({ recordedDate: -1 })
      .exec();
  }
}

export const marketPriceRepository = new MarketPriceRepository();
