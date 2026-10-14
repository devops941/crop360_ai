import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { AuditLogger } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = Number(searchParams.get('limit')) || 100;

    let logs;
    if (entityType && entityId) {
      logs = await AuditLogger.getEntityLogs(entityType, entityId, limit);
    } else {
      logs = await AuditLogger.getRecentLogs(limit);
    }

    return ApiResponseHelper.success(logs, 'Audit logs retrieved successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to fetch audit logs', error);
  }
}
