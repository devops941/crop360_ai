import { BaseRepository } from './base.repository';
import { IrrigationScheduleModel, IIrrigationSchedule } from '@/models/irrigation.model';

export class IrrigationRepository extends BaseRepository<IIrrigationSchedule> {
  constructor() {
    super(IrrigationScheduleModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<IIrrigationSchedule[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ scheduledDate: -1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres irrigationSource soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .exec();
  }
}

export const irrigationRepository = new IrrigationRepository();
