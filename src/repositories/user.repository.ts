import { BaseRepository } from './base.repository';
import { UserModel, IUserDoc } from '@/models/user.model';

export class UserRepository extends BaseRepository<IUserDoc> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUserDoc | null> {
    await this.ensureConnection();
    const query = this.model.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async findByGoogleId(googleId: string): Promise<IUserDoc | null> {
    await this.ensureConnection();
    return this.model.findOne({ googleId }).exec();
  }
}

export const userRepository = new UserRepository();
