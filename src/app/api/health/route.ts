import { ApiResponseHelper } from '@/lib/api-response';
import { HealthService } from '@/services/health.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = HealthService.getAppHealth();
    return ApiResponseHelper.success(health, 'Application is running normally');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to check application health', error);
  }
}
