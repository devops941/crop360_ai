import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { soilReportRepository } from '@/repositories/soil-report.repository';
import { validateSoilReportInput } from '@/validators/soil-report.validator';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const farmId = searchParams.get('farmId');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (farmerId) filter.farmerId = farmerId;
    if (farmId) filter.farmId = farmId;
    if (status) filter.status = status;

    const reports = await soilReportRepository.findAllWithRelations(filter);
    return ApiResponse.success(reports);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch soil reports', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { isValid, errors } = validateSoilReportInput(body);
    if (!isValid) {
      return ApiResponse.badRequest('Validation failed', errors);
    }

    const sampleCode = await soilReportRepository.generateNextSampleCode();

    const report = await soilReportRepository.create({
      ...body,
      sampleCode,
      testDate: body.testDate ? new Date(body.testDate) : new Date(),
    });

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SoilReport',
      entityId: String(report._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: report.toObject ? report.toObject() : (report as unknown as Record<string, unknown>),
    });

    return ApiResponse.created(report, 'Soil test report registered successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to create soil report', error);
  }
}
