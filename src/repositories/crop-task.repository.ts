import { BaseRepository } from './base.repository';
import { CropTaskModel, ICropTask } from '@/models/crop-task.model';

export class CropTaskRepository extends BaseRepository<ICropTask> {
  constructor() {
    super(CropTaskModel);
  }

  async findWithDetails(filter: Record<string, unknown> = {}, limit = 50): Promise<ICropTask[]> {
    await this.ensureConnection();
    return this.model
      .find(filter)
      .sort({ scheduledDate: 1 })
      .limit(limit)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('planId', 'cropName varietyName targetHarvestDate')
      .exec();
  }

  async findByFarm(farmId: string): Promise<ICropTask[]> {
    await this.ensureConnection();
    return this.model
      .find({ farmId })
      .sort({ scheduledDate: 1 })
      .populate('farmerId', 'name farmerCode')
      .populate('farmId', 'parcelName surveyNumber')
      .exec();
  }

  async updateTaskStatus(id: string, status: string, completedDate?: Date): Promise<ICropTask | null> {
    await this.ensureConnection();
    const update: Record<string, unknown> = { status };
    if (completedDate || status === 'done') {
      update.completedDate = completedDate || new Date();
    }
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}

export const cropTaskRepository = new CropTaskRepository();
