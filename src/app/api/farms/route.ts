import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { farmRepository } from '@/repositories/farm.repository';
import { farmSchema, validateRequest } from '@/validators';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const district = searchParams.get('district');

    const filter: Record<string, unknown> = {};
    if (farmerId) filter.farmerId = farmerId;
    if (district) filter.district = district;

    const farms = await farmRepository.findAllWithFarmer(filter);
    return ApiResponseHelper.success(farms, 'Farms retrieved successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to fetch farms', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifyAuthToken(sessionCookie) : null;

    const body = await request.json();
    const validation = await validateRequest(farmSchema, body);
    if (!validation.success) {
      return ApiResponseHelper.error(
        'Validation failed',
        422,
        'VALIDATION_ERROR',
        validation.errors
      );
    }

    const farm = await farmRepository.create(validation.data);

    // Audit Log Create
    await AuditLogger.record({
      entityType: 'Farm',
      entityId: String(farm._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'Authorized User',
        userRole: session?.role || 'operator',
      },
      after: farm.toObject ? farm.toObject() : (farm as Record<string, unknown>),
    });

    return ApiResponseHelper.success(farm, 'Land parcel registered successfully', 201);
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to register land parcel', error);
  }
}
