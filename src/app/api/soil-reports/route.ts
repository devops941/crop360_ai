import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { soilReportRepository } from '@/repositories/soil-report.repository';
import { validateSoilReportInput } from '@/validators/soil-report.validator';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { getTenantScope } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const farmId = searchParams.get('farmId');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    if (!scope.isAdmin) {
      if (farmerId) {
        if (scope.farmerIdStrings.includes(String(farmerId))) {
          filter.farmerId = farmerId;
        } else {
          return ApiResponse.success([]);
        }
      } else {
        filter.farmerId = { $in: scope.farmerIds };
      }

      if (farmId) {
        if (scope.farmIdStrings.includes(String(farmId))) {
          filter.farmId = farmId;
        } else {
          return ApiResponse.success([]);
        }
      }
    } else {
      if (farmerId) filter.farmerId = farmerId;
      if (farmId) filter.farmId = farmId;
    }

    const reports = await soilReportRepository.findAllWithRelations(filter);
    return ApiResponse.success(reports);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch soil reports', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const body = await request.json();

    const { isValid, errors } = validateSoilReportInput(body);
    if (!isValid) {
      return ApiResponse.badRequest('Validation failed', errors);
    }

    if (!scope.isAdmin && body.farmerId && !scope.farmerIdStrings.includes(String(body.farmerId))) {
      return ApiResponse.forbidden('Unauthorized: You can only create soil reports for your own farmer profile');
    }

    const sampleCode = await soilReportRepository.generateNextSampleCode();

    const report = await soilReportRepository.create({
      ...body,
      sampleCode,
      testDate: body.testDate ? new Date(body.testDate) : new Date(),
    });

    // Automatically execute AI Soil Analysis & issue official Soil Health Card immediately
    try {
      const { SoilAnalysisService } = await import('@/services/soil-analysis.service');
      const { SoilCardService } = await import('@/services/soil-card.service');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await SoilAnalysisService.executeAnalysis(report as any);
      await SoilCardService.issueCardForReport(String(report._id));
    } catch (autoErr) {
      console.warn('Auto analysis & card generation notice:', autoErr);
    }

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

    return ApiResponse.created(report, 'Soil test report registered & analyzed successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to create soil report', error);
  }
}
