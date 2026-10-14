import mongoose, { Schema, Document, Model } from 'mongoose';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
export type AlertCategory = 'WEATHER' | 'PEST_DISEASE' | 'IRRIGATION' | 'MARKET_PRICE' | 'HARVEST' | 'SYSTEM';
export type NotificationChannel = 'IN_APP' | 'SMS' | 'WHATSAPP' | 'VOICE_CALL';

export interface IAlertNotification extends Document {
  farmerId: string;
  farmId?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  messageVernacular?: {
    ta?: string;
    hi?: string;
  };
  channels: NotificationChannel[];
  deliveryStatus: {
    inApp: 'DELIVERED' | 'READ' | 'PENDING';
    sms?: 'SENT' | 'FAILED' | 'PENDING';
    whatsapp?: 'SENT' | 'FAILED' | 'PENDING';
  };
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlertNotificationSchema = new Schema<IAlertNotification>(
  {
    farmerId: { type: String, required: true, index: true },
    farmId: { type: String, index: true },
    category: {
      type: String,
      enum: ['WEATHER', 'PEST_DISEASE', 'IRRIGATION', 'MARKET_PRICE', 'HARVEST', 'SYSTEM'],
      required: true,
      default: 'SYSTEM',
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'WARNING', 'INFO', 'SUCCESS'],
      required: true,
      default: 'INFO',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    messageVernacular: {
      ta: { type: String },
      hi: { type: String },
    },
    channels: [{ type: String, enum: ['IN_APP', 'SMS', 'WHATSAPP', 'VOICE_CALL'] }],
    deliveryStatus: {
      inApp: { type: String, enum: ['DELIVERED', 'READ', 'PENDING'], default: 'DELIVERED' },
      sms: { type: String, enum: ['SENT', 'FAILED', 'PENDING'] },
      whatsapp: { type: String, enum: ['SENT', 'FAILED', 'PENDING'] },
    },
    isRead: { type: Boolean, default: false },
    actionUrl: { type: String },
  },
  { timestamps: true }
);

export const AlertNotification: Model<IAlertNotification> =
  mongoose.models.AlertNotification ||
  mongoose.model<IAlertNotification>('AlertNotification', AlertNotificationSchema);
