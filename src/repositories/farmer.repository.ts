import { BaseRepository } from './base.repository';
import { FarmerModel, IFarmerDoc } from '@/models/farmer.model';

export class FarmerRepository extends BaseRepository<IFarmerDoc> {
  constructor() {
    super(FarmerModel);
  }

  async findByPhone(phone: string): Promise<IFarmerDoc | null> {
    await this.ensureConnection();
    return this.model.findOne({ phone: phone.trim() }).exec();
  }

  async findByFarmerCode(farmerCode: string): Promise<IFarmerDoc | null> {
    await this.ensureConnection();
    return this.model.findOne({ farmerCode: farmerCode.toUpperCase().trim() }).exec();
  }

  async generateNextFarmerCode(stateCode = 'TN'): Promise<string> {
    await this.ensureConnection();
    const count = await this.model.countDocuments();
    const sequence = String(count + 1).padStart(5, '0');
    return `FRM-${stateCode}-${sequence}`;
  }
}

export const farmerRepository = new FarmerRepository();
