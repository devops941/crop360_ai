import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { soilReportRepository } from '@/repositories/soil-report.repository';
import { SoilAnalysisService } from '@/services/soil-analysis.service';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    const report = await soilReportRepository.findById(id);

    if (!report) {
      return ApiResponse.notFound('Soil test report not found for analysis');
    }

    const analysis = await SoilAnalysisService.executeAnalysis(report);

    // Update report status to 'analyzed'
    report.status = 'analyzed';
    await report.save();

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SoilReport',
      entityId: id,
      action: 'ANALYZE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: {
        overallHealthScore: analysis.overallHealthScore,
        fertilityRating: analysis.fertilityRating,
        recommendationsCount: analysis.actionPlan.length,
      },
    });

    return ApiResponse.success(analysis, 'AI Soil Analysis completed successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to analyze soil report', error);
  }
}
