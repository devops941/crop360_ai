import { ApiResponseHelper } from '@/lib/api-response';
import { ApiRootData } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiInfo: ApiRootData = {
      name: 'Crop360 AI API',
      version: '0.1.0',
      description: 'AI-driven comprehensive agriculture management API',
      endpoints: {
        health: '/api/health',
        dbHealth: '/api/health/db',
      },
    };

    return ApiResponseHelper.success(apiInfo, 'Crop360 AI API is online');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to retrieve API info', error);
  }
}
