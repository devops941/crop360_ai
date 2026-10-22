import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { LandPreparationPlan } from '@/models/land-prep.model';
import { CropRecommendationPlan } from '@/models/crop-recommendation.model';
import { Farm } from '@/models/farm.model';
import { LandPrepGeneratorService } from '@/services/land-prep-generator.service';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { getTenantScope } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const farmId = searchParams.get('farmId');

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

    if (farmId) filter.farmId = farmId;

    const plans = await LandPreparationPlan.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(plans);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch land preparation plans', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const body = await request.json();
    const { farmerId, farmId, cropName = 'Paddy', tillageType = 'conventional' } = body;

    if (!farmerId || !farmId) {
      return ApiResponse.badRequest('farmerId and farmId are required');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to schedule land preparation for this farmer');
    }

    const farm = await Farm.findById(farmId);
    const generated = await LandPrepGeneratorService.generate(
      cropName,
      farm?.soilType || 'loam'
    );

    const plan = await LandPreparationPlan.create({
      farmerId,
      farmId,
      cropName,
      season: 'Kharif 2026',
      tillageType: generated.tillageType,
      basalFYMApplicationTonnesPerAcre: generated.basalFYMApplicationTonnesPerAcre,
      soilAmendmentRequired: generated.soilAmendmentRequired,
      operations: generated.operations,
      readinessScorePercent: 0,
      status: 'planning',
    });

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'LandPreparationPlan',
      entityId: String(plan._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: (plan.toObject ? plan.toObject() : plan) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(plan, 'Land preparation plan scheduled successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to schedule land preparation plan', error);
  }
}
