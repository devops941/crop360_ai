import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { CropRecommendationPlan } from '@/models/crop-recommendation.model';
import { Farm } from '@/models/farm.model';
import { SoilReport } from '@/models/soil-report.model';
import { CropSuitabilityEngine } from '@/services/crop-suitability.service';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const farmId = searchParams.get('farmId');

    const filter: Record<string, unknown> = {};
    if (farmerId) filter.farmerId = farmerId;
    if (farmId) filter.farmId = farmId;

    const plans = await CropRecommendationPlan.find(filter)
      .populate('farmerId', 'name farmerCode phone district state')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType irrigationSource')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(plans);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch crop recommendation plans', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { farmerId, farmId, soilReportId, targetSeason } = body;

    if (!farmerId || !farmId) {
      return ApiResponse.badRequest('farmerId and farmId are required');
    }

    const farm = await Farm.findById(farmId);
    if (!farm) {
      return ApiResponse.notFound('Farm parcel not found');
    }

    let reportParams = undefined;
    if (soilReportId) {
      const report = await SoilReport.findById(soilReportId);
      if (report && report.parameters) {
        reportParams = report.parameters;
      }
    }

    const evaluatedRecommendations = CropSuitabilityEngine.evaluateCrops({
      soilType: farm.soilType,
      irrigationSource: farm.irrigationSource,
      waterAvailabilityMonths: farm.waterAvailabilityMonths || 8,
      parameters: reportParams,
      season: targetSeason || 'kharif',
    });

    const plan = await CropRecommendationPlan.create({
      farmerId,
      farmId,
      soilReportId: soilReportId || undefined,
      targetSeason: targetSeason || 'kharif',
      targetYear: new Date().getFullYear(),
      marketPriceTrendsSummary: 'APMC terminal market arrivals stable with firm wholesale price realizations.',
      recommendations: evaluatedRecommendations,
      selectedCrop: evaluatedRecommendations[0]?.cropName,
      status: 'confirmed',
    });

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'CropRecommendationPlan',
      entityId: String(plan._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: (plan.toObject ? plan.toObject() : plan) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(plan, 'Crop recommendation plan generated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to generate crop recommendation plan', error);
  }
}
