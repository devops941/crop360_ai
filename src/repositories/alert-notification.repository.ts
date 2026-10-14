import { BaseRepository } from './base.repository';
import { AlertNotification, IAlertNotification } from '@/models/alert-notification.model';

export class AlertNotificationRepository extends BaseRepository<IAlertNotification> {
  constructor() {
    super(AlertNotification);
  }

  static async getAll(filter: Record<string, unknown> = {}): Promise<IAlertNotification[]> {
    const repo = new AlertNotificationRepository();
    await repo.ensureConnection();
    return repo.model.find(filter).sort({ createdAt: -1 }).limit(100).exec();
  }

  static async getById(id: string): Promise<IAlertNotification | null> {
    const repo = new AlertNotificationRepository();
    await repo.ensureConnection();
    return repo.model.findById(id).exec();
  }

  static async create(data: Partial<IAlertNotification>): Promise<IAlertNotification> {
    const repo = new AlertNotificationRepository();
    await repo.ensureConnection();
    const doc = new repo.model(data);
    return doc.save();
  }

  static async markAsRead(id: string): Promise<IAlertNotification | null> {
    const repo = new AlertNotificationRepository();
    await repo.ensureConnection();
    return repo.model.findByIdAndUpdate(
      id,
      { isRead: true, 'deliveryStatus.inApp': 'READ' },
      { new: true }
    ).exec();
  }

  static async markAllAsRead(farmerId: string): Promise<void> {
    const repo = new AlertNotificationRepository();
    await repo.ensureConnection();
    await repo.model.updateMany(
      { farmerId, isRead: false },
      { isRead: true, 'deliveryStatus.inApp': 'READ' }
    ).exec();
  }
}

export const alertNotificationRepository = new AlertNotificationRepository();
