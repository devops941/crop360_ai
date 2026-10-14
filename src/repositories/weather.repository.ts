import { BaseRepository } from './base.repository';
import { WeatherLogModel, IWeatherLog } from '@/models/weather-log.model';

export class WeatherRepository extends BaseRepository<IWeatherLog> {
  constructor() {
    super(WeatherLogModel);
  }

  async getLatestByDistrict(district: string): Promise<IWeatherLog | null> {
    await this.ensureConnection();
    return this.model
      .findOne({ district: new RegExp(`^${district}$`, 'i') })
      .sort({ recordedDate: -1 })
      .exec();
  }

  async findRecent(limit = 10): Promise<IWeatherLog[]> {
    await this.ensureConnection();
    return this.model
      .find()
      .sort({ recordedDate: -1 })
      .limit(limit)
      .exec();
  }
}

export const weatherRepository = new WeatherRepository();
