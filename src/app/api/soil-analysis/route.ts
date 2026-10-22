import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SoilAnalysisResult } from '@/models/soil-analysis.model';
import { SoilReport } from '@/models/soil-report.model';
import { SoilAnalysisService } from '@/services/soil-analysis.service';
import { getTenantScope } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const farmerId = searchParams.get('farmerId');

    // Auto-analyze any pending soil reports for this tenant
    try {
      const pendingQuery: Record<string, unknown> = {};
      if (!scope.isAdmin) {
        pendingQuery.farmerId = { $in: scope.farmerIds };
      }
      if (reportId) pendingQuery._id = reportId;
      if (farmerId && (scope.isAdmin || scope.farmerIdStrings.includes(String(farmerId)))) {
        pendingQuery.farmerId = farmerId;
      }

      const unanalyzedReports = await SoilReport.find(pendingQuery);
      for (const rep of unanalyzedReports) {
        const hasAnalysis = await SoilAnalysisResult.exists({ reportId: rep._id });
        if (!hasAnalysis) {
          await SoilAnalysisService.executeAnalysis(rep);
          if (rep.status === 'pending') {
            rep.status = 'analyzed';
            await rep.save();
          }
        }
      }
    } catch (autoErr) {
      console.warn('Auto-analysis check notice:', autoErr);
    }

    const filter: Record<string, unknown> = {};
    if (!scope.isAdmin) {
      if (farmerId) {
        if (scope.farmerIdStrings.includes(String(farmerId))) {
          filter.farmerId = farmerId;
        } else {
          return ApiResponse.success([], 'No records found');
        }
      } else {
        filter.farmerId = { $in: scope.farmerIds };
      }
    } else if (farmerId) {
      filter.farmerId = farmerId;
    }

    if (reportId) filter.reportId = reportId;

    const analyses = await SoilAnalysisResult.find(filter)
      .populate('farmerId', 'name farmerCode phone district state')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('reportId', 'sampleCode testDate testingLabName')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(analyses);
  } catch (error) {
    return ApiResponse.serverError(error instanceof Error ? error.message : 'Failed to fetch soil analyses');
  }
}
