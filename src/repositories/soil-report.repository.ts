import { BaseRepository } from './base.repository';
import { ISoilReport, SoilReport } from '@/models/soil-report.model';

export class SoilReportRepository extends BaseRepository<ISoilReport> {
  constructor() {
    super(SoilReport);
  }

  async generateNextSampleCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SHC-${year}-`;
    const latest = await this.model
      .findOne({ sampleCode: { $regex: `^${prefix}` } })
      .sort({ sampleCode: -1 })
      .lean();

    if (!latest || !latest.sampleCode) {
      return `${prefix}0001`;
    }

    const currentNumber = parseInt(latest.sampleCode.replace(prefix, ''), 10);
    const nextNumber = isNaN(currentNumber) ? 1 : currentNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  async findAllWithRelations(filter: Record<string, unknown> = {}) {
    return this.model
      .find(filter)
      .populate('farmerId', 'name farmerCode phone district state')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByIdWithRelations(id: string) {
    return this.model
      .findById(id)
      .populate('farmerId', 'name farmerCode phone district state aadhaarLastFour')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType irrigationSource')
      .lean();
  }
}

export const soilReportRepository = new SoilReportRepository();
