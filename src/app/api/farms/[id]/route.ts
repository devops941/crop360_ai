import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { farmRepository } from '@/repositories/farm.repository';
import { farmSchema, validateRequest } from '@/validators';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const farm = await farmRepository.findById(id);
    if (!farm) {
      return ApiResponseHelper.error('Farm parcel not found', 404, 'NOT_FOUND');
    }
    return ApiResponseHelper.success(farm, 'Farm parcel retrieved');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to fetch farm parcel', error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifyAuthToken(sessionCookie) : null;

    const existing = await farmRepository.findById(id);
    if (!existing) {
      return ApiResponseHelper.error('Farm parcel not found', 404, 'NOT_FOUND');
    }

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

    const beforeData = existing.toObject
      ? existing.toObject()
      : (existing as Record<string, unknown>);
    const updated = await farmRepository.update(id, validation.data);
    const afterData = updated?.toObject ? updated.toObject() : (updated as Record<string, unknown>);

    // Audit Log Update
    await AuditLogger.record({
      entityType: 'Farm',
      entityId: id,
      action: 'UPDATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'Authorized User',
        userRole: session?.role || 'operator',
      },
      before: beforeData,
      after: afterData,
    });

    return ApiResponseHelper.success(updated, 'Farm parcel updated successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to update farm parcel', error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifyAuthToken(sessionCookie) : null;

    const existing = await farmRepository.findById(id);
    if (!existing) {
      return ApiResponseHelper.error('Farm parcel not found', 404, 'NOT_FOUND');
    }

    await farmRepository.delete(id);

    // Audit Log Delete
    await AuditLogger.record({
      entityType: 'Farm',
      entityId: id,
      action: 'DELETE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'Authorized User',
        userRole: session?.role || 'operator',
      },
      before: existing.toObject ? existing.toObject() : (existing as Record<string, unknown>),
    });

    return ApiResponseHelper.success(null, 'Farm parcel deleted successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to delete farm parcel', error);
  }
}
