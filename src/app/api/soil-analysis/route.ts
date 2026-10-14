import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SoilAnalysisResult } from '@/models/soil-analysis.model';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const farmerId = searchParams.get('farmerId');

    const filter: Record<string, unknown> = {};
    if (reportId) filter.reportId = reportId;
    if (farmerId) filter.farmerId = farmerId;

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
