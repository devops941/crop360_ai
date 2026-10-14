import { ApiResponseHelper } from '@/lib/api-response';
import { HealthService } from '@/services/health.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbHealth = await HealthService.getDatabaseHealth();

    if (dbHealth.status !== 'connected') {
      return ApiResponseHelper.error(
        'Database connection unavailable',
        503,
        'DATABASE_UNAVAILABLE',
        { status: dbHealth.status, database: dbHealth.database }
      );
    }

    return ApiResponseHelper.success(
      dbHealth,
      'MongoDB database connection is healthy and responsive'
    );
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to execute database health check', error);
  }
}
