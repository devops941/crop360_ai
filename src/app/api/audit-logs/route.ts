import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { AuditLogger } from '@/lib/audit-logger';
import { AuditLogModel } from '@/models/audit-log.model';
import { connectToDatabase } from '@/lib/mongodb';
import { getTenantScope } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = Number(searchParams.get('limit')) || 100;

    const filter: Record<string, unknown> = {};
    if (!scope.isAdmin) {
      filter['performedBy.userId'] = scope.userId;
    }
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;

    const logs = await AuditLogModel.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
      .exec();

    return ApiResponseHelper.success(logs, 'Audit logs retrieved successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to fetch audit logs', error);
  }
}
