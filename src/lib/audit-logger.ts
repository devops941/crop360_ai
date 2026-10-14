import { AuditLogModel, AuditAction } from '@/models/audit-log.model';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export interface RecordAuditParams {
  entityType: string;
  entityId: string;
  action: AuditAction;
  performedBy?: {
    userId?: string;
    userName?: string;
    userRole?: string;
  };
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
}

export class AuditLogger {
  static async record(params: RecordAuditParams): Promise<void> {
    try {
      await connectToDatabase();

      let diff: string[] = [];
      if (params.before && params.after) {
        const allKeys = Array.from(
          new Set([...Object.keys(params.before), ...Object.keys(params.after)])
        );
        diff = allKeys.filter((key) => {
          if (key === 'updatedAt' || key === '__v') return false;
          return JSON.stringify(params.before?.[key]) !== JSON.stringify(params.after?.[key]);
        });
      }

      await AuditLogModel.create({
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        performedBy: params.performedBy || { userName: 'System' },
        changes: {
          before: params.before || undefined,
          after: params.after || undefined,
          diff,
        },
        metadata: params.metadata,
        timestamp: new Date(),
      });

      logger.info(
        `Audit: [${params.action}] on ${params.entityType} (ID: ${params.entityId}) by ${params.performedBy?.userName || 'System'}`
      );
    } catch (err) {
      logger.error('Failed to write audit log', {
        error: err instanceof Error ? err.message : String(err),
        params,
      });
    }
  }

  static async getEntityLogs(entityType: string, entityId: string, limit = 50) {
    await connectToDatabase();
    return AuditLogModel.find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  static async getRecentLogs(limit = 100) {
    await connectToDatabase();
    return AuditLogModel.find().sort({ timestamp: -1 }).limit(limit).lean().exec();
  }
}
