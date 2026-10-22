import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { farmRepository } from '@/repositories/farm.repository';
import { farmSchema, validateRequest } from '@/validators';
import { AuditLogger } from '@/lib/audit-logger';
import { getTenantScope, getAuthenticatedUser } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const district = searchParams.get('district');

    const filter: Record<string, unknown> = {};
    if (district) filter.district = district;

    if (!scope.isAdmin) {
      if (farmerId) {
        if (scope.farmerIdStrings.includes(String(farmerId))) {
          filter.farmerId = farmerId;
        } else {
          return ApiResponseHelper.success([], 'Farms retrieved successfully');
        }
      } else {
        filter.farmerId = { $in: scope.farmerIds };
      }
    } else if (farmerId) {
      filter.farmerId = farmerId;
    }

    const farms = await farmRepository.findAllWithFarmer(filter);
    return ApiResponseHelper.success(farms, 'Farms retrieved successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to fetch farms', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const scope = await getTenantScope(request);
    const session = scope.session;

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

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(validation.data.farmerId))) {
      return ApiResponseHelper.error(
        'Unauthorized: You can only register land parcels for your own farmer profile',
        403,
        'FORBIDDEN'
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
