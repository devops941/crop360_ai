import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { soilReportRepository } from '@/repositories/soil-report.repository';
import { validateSoilReportInput } from '@/validators/soil-report.validator';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    const report = await soilReportRepository.findByIdWithRelations(id);

    if (!report) {
      return ApiResponse.notFound('Soil test report not found');
    }

    return ApiResponse.success(report);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch soil report', error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    const existing = await soilReportRepository.findById(id);

    if (!existing) {
      return ApiResponse.notFound('Soil test report not found');
    }

    const body = await request.json();
    const { isValid, errors } = validateSoilReportInput({ ...existing.toObject(), ...body });
    if (!isValid) {
      return ApiResponse.badRequest('Validation failed', errors);
    }

    const updated = await soilReportRepository.update(id, body);

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SoilReport',
      entityId: id,
      action: 'UPDATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      before: existing.toObject ? existing.toObject() : (existing as unknown as Record<string, unknown>),
      after: updated && 'toObject' in updated ? (updated as any).toObject() : (updated as unknown as Record<string, unknown>),
    });

    return ApiResponse.success(updated, 'Soil report updated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to update soil report', error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    const existing = await soilReportRepository.findById(id);

    if (!existing) {
      return ApiResponse.notFound('Soil test report not found');
    }

    await soilReportRepository.delete(id);

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SoilReport',
      entityId: id,
      action: 'DELETE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      before: existing.toObject ? existing.toObject() : (existing as unknown as Record<string, unknown>),
    });

    return ApiResponse.success({ id }, 'Soil test report deleted successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to delete soil report', error);
  }
}
