import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { HarvestPredictionModel } from '@/models/harvest-prediction.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (farmId) filter.farmId = farmId;
    if (farmerId) filter.farmerId = farmerId;
    if (status) filter.readinessStatus = status;

    const predictions = await HarvestPredictionModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ optimalHarvestStartDate: 1 })
      .lean();

    return ApiResponse.success(predictions);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch harvest readiness predictions', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      farmerId,
      farmId,
      sowingId,
      cropName,
      varietyName,
      accumulatedGDD = 1950,
      grainMoisturePercent = 19.5,
      visualMaturityIndexPercent = 85,
      optimalHarvestStartDate,
      optimalHarvestEndDate,
      predictedYieldQuintalsPerAcre = 26.5,
      shatteringRiskRating = 'low',
      readinessStatus = 'optimal_window',
      notes,
    } = body;

    if (!farmerId || !farmId || !cropName || !varietyName) {
      return ApiResponse.badRequest('farmerId, farmId, cropName, and varietyName are required');
    }

    const start = optimalHarvestStartDate ? new Date(optimalHarvestStartDate) : new Date();
    let end = optimalHarvestEndDate ? new Date(optimalHarvestEndDate) : new Date(start);
    if (!optimalHarvestEndDate) {
      end.setDate(start.getDate() + 3);
    }

    const prediction = await HarvestPredictionModel.create({
      farmerId,
      farmId,
      sowingId: sowingId || undefined,
      cropName,
      varietyName,
      accumulatedGDD: Number(accumulatedGDD),
      grainMoisturePercent: Number(grainMoisturePercent),
      visualMaturityIndexPercent: Number(visualMaturityIndexPercent),
      optimalHarvestStartDate: start,
      optimalHarvestEndDate: end,
      predictedYieldQuintalsPerAcre: Number(predictedYieldQuintalsPerAcre),
      shatteringRiskRating,
      readinessStatus,
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'HarvestPrediction',
        entityId: String(prediction._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (prediction.toObject ? prediction.toObject() : prediction) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(prediction);
  } catch (error) {
    return ApiResponse.serverError('Failed to record harvest readiness prediction', error);
  }
}
