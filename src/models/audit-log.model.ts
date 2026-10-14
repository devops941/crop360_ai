import mongoose, { Document, Model, Schema } from 'mongoose';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'ANALYZE';

export interface IAuditLogDoc extends Document {
  entityType: string;
  entityId: string;
  action: AuditAction;
  performedBy: {
    userId?: string;
    userName?: string;
    userRole?: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    diff?: string[];
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLogDoc>(
  {
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'ANALYZE'],
      required: true,
      index: true,
    },
    performedBy: {
      userId: { type: String, index: true },
      userName: { type: String },
      userRole: { type: String },
    },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
      diff: [{ type: String }],
    },
    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const AuditLogModel: Model<IAuditLogDoc> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDoc>('AuditLog', auditLogSchema);
