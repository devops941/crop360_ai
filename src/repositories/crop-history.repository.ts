import { BaseRepository } from './base.repository';
import { CropHistory, ICropHistory, IHistoricalSeasonRecord } from '@/models/crop-history.model';

export class CropHistoryRepository extends BaseRepository<ICropHistory> {
  constructor() {
    super(CropHistory);
  }

  static async getAll(filter: Record<string, unknown> = {}): Promise<ICropHistory[]> {
    const repo = new CropHistoryRepository();
    await repo.ensureConnection();
    return repo.model.find(filter).exec();
  }

  static async getById(id: string): Promise<ICropHistory | null> {
    const repo = new CropHistoryRepository();
    await repo.ensureConnection();
    return repo.model.findById(id).exec();
  }

  static async create(data: Partial<ICropHistory>): Promise<ICropHistory> {
    const repo = new CropHistoryRepository();
    await repo.ensureConnection();
    const doc = new repo.model(data);
    return doc.save();
  }

  static async addSeasonRecord(id: string, record: IHistoricalSeasonRecord): Promise<ICropHistory | null> {
    const repo = new CropHistoryRepository();
    await repo.ensureConnection();
    return repo.model.findByIdAndUpdate(
      id,
      { $push: { annualHistory: record } },
      { new: true }
    ).exec();
  }
}

export const cropHistoryRepository = new CropHistoryRepository();
