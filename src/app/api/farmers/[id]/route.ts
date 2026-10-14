import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { farmerRepository } from '@/repositories/farmer.repository';
import { farmerSchema, validateRequest } from '@/validators';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const farmer = await farmerRepository.findById(id);
    if (!farmer) {
      return ApiResponseHelper.error('Farmer not found', 404, 'NOT_FOUND');
    }
    return ApiResponseHelper.success(farmer, 'Farmer retrieved');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to fetch farmer', error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifyAuthToken(sessionCookie) : null;

    const existing = await farmerRepository.findById(id);
    if (!existing) {
      return ApiResponseHelper.error('Farmer not found', 404, 'NOT_FOUND');
    }

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

    const beforeData = existing.toObject
      ? existing.toObject()
      : (existing as unknown as Record<string, unknown>);
    const updated = await farmerRepository.update(id, validation.data);
    const afterData = updated?.toObject
      ? updated.toObject()
      : (updated as unknown as Record<string, unknown>);

    // Audit Log Update
    await AuditLogger.record({
      entityType: 'Farmer',
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

    return ApiResponseHelper.success(updated, 'Farmer details updated successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to update farmer', error);
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

    const existing = await farmerRepository.findById(id);
    if (!existing) {
      return ApiResponseHelper.error('Farmer not found', 404, 'NOT_FOUND');
    }

    await farmerRepository.delete(id);

    // Audit Log Delete
    await AuditLogger.record({
      entityType: 'Farmer',
      entityId: id,
      action: 'DELETE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'Authorized User',
        userRole: session?.role || 'operator',
      },
      before: existing.toObject
        ? existing.toObject()
        : (existing as unknown as Record<string, unknown>),
    });

    return ApiResponseHelper.success(null, 'Farmer record deleted successfully');
  } catch (error) {
    return ApiResponseHelper.internalError('Failed to delete farmer', error);
  }
}
