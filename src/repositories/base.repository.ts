import mongoose, { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Generic Base Repository providing standard CRUD capabilities
 * adhering to the architecture: Route Handler -> Validation -> Service -> Repository -> Model -> Database
 */
export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  protected async ensureConnection(): Promise<typeof mongoose> {
    return connectToDatabase();
  }

  async findById(id: string): Promise<T | null> {
    await this.ensureConnection();
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    await this.ensureConnection();
    return this.model.findOne(filter).exec();
  }

  async find(filter: FilterQuery<T> = {}, skip = 0, limit = 20): Promise<T[]> {
    await this.ensureConnection();
    return this.model.find(filter).skip(skip).limit(limit).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    await this.ensureConnection();
    const entity = new this.model(data);
    return entity.save() as unknown as T;
  }

  async update(id: string, updateData: UpdateQuery<T>): Promise<T | null> {
    await this.ensureConnection();
    return this.model.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    await this.ensureConnection();
    return this.model.countDocuments(filter).exec();
  }
}
