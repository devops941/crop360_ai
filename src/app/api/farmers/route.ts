import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { farmerRepository } from '@/repositories/farmer.repository';
import { farmerSchema, validateRequest } from '@/validators';
import { AuditLogger } from '@/lib/audit-logger';
import { getTenantScope, getAuthenticatedUser } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const district = searchParams.get('district') || '';
    const status = searchParams.get('status') || '';

    const filter: Record<string, unknown> = {};
    if (district) filter.district = district;
    if (status) filter.status = status;

    if (!scope.isAdmin) {
      filter.$and = [
        {
          $or: [
            { createdBy: scope.userId },
            ...(scope.email ? [{ email: scope.email }] : []),
          ],
        },
      ];
    }

    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { farmerCode: { $regex: search, $options: 'i' } },
      ];
      if (filter.$and) {
        (filter.$and as Array<unknown>).push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
    }

    const farmers = await farmerRepository.find(filter, 0, 100);
    return ApiResponseHelper.success(farmers, 'Farmers fetched successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to fetch farmers', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser(request);

    const body = await request.json();
    const validation = await validateRequest(farmerSchema, body);

    if (!validation.success) {
      return ApiResponseHelper.error(
        'Validation failed',
        422,
        'VALIDATION_ERROR',
        validation.errors
      );
    }

    // Check duplicate phone
    const existing = await farmerRepository.findByPhone(validation.data.phone);
    if (existing) {
      return ApiResponseHelper.error(
        'A farmer with this phone number already exists',
        400,
        'DUPLICATE_PHONE'
      );
    }

    const stateCode = validation.data.state.substring(0, 2).toUpperCase() || 'TN';
    const farmerCode = await farmerRepository.generateNextFarmerCode(stateCode);

    const farmer = await farmerRepository.create({
      ...validation.data,
      farmerCode,
      createdBy: session?.userId,
    });

    // Record Audit Log
    await AuditLogger.record({
      entityType: 'Farmer',
      entityId: String(farmer._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'Authorized User',
        userRole: session?.role || 'operator',
      },
      after: farmer.toObject ? farmer.toObject() : (farmer as unknown as Record<string, unknown>),
    });

    return ApiResponseHelper.success(farmer, 'Farmer registered successfully', 201);
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to register farmer', error);
  }
}
