import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { NutrientManagementModel } from '@/models/nutrient-management.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');

    const filter: Record<string, unknown> = {};
    if (farmId) filter.farmId = farmId;
    if (farmerId) filter.farmerId = farmerId;

    const plans = await NutrientManagementModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(plans);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch nutrient management plans', error);
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
      cropName = 'Paddy (Rice)',
      varietyName = 'CO 51',
      targetYieldQuintalsPerAcre = 25,
      organicManureTonnesPerAcre = 5,
      notes,
    } = body;

    if (!farmerId || !farmId) {
      return ApiResponse.badRequest('farmerId and farmId are required');
    }

    // ICAR / TNAU Scientific Split Schedule
    const defaultSplitSchedule = [
      {
        stage: 'basal',
        timingDaysAfterSowing: 0,
        fertilizerType: 'DAP (50kg) + MOP (20kg) + Zinc Sulphate (10kg)',
        quantityKgPerAcre: 80,
        applicationMethod: 'soil_incorporation',
        status: 'scheduled',
      },
      {
        stage: 'first_top_dress',
        timingDaysAfterSowing: 20,
        fertilizerType: 'Neem Coated Urea (45kg)',
        quantityKgPerAcre: 45,
        applicationMethod: 'broadcasting',
        status: 'scheduled',
      },
      {
        stage: 'second_top_dress',
        timingDaysAfterSowing: 45,
        fertilizerType: 'Urea (35kg) + MOP (15kg)',
        quantityKgPerAcre: 50,
        applicationMethod: 'broadcasting',
        status: 'scheduled',
      },
      {
        stage: 'foliar_spray',
        timingDaysAfterSowing: 65,
        fertilizerType: '19-19-19 Soluble NPK + Micronutrient Booster',
        quantityKgPerAcre: 3,
        applicationMethod: 'foliar_spray',
        status: 'scheduled',
      },
    ];

    // Estimated fertilizer costs per acre in INR (Subsidized Indian APMC/Co-op prices)
    const totalCost = 80 * 24 + 45 * 6 + 50 * 20 + 3 * 180 + organicManureTonnesPerAcre * 400;

    const plan = await NutrientManagementModel.create({
      farmerId,
      farmId,
      sowingId: sowingId || undefined,
      cropName,
      varietyName,
      targetYieldQuintalsPerAcre: Number(targetYieldQuintalsPerAcre),
      splitApplications: defaultSplitSchedule,
      totalFertilizerCostEstInr: Math.round(totalCost),
      organicManureTonnesPerAcre: Number(organicManureTonnesPerAcre),
      status: 'active',
      notes,
    });

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'NutrientPlan',
      entityId: String(plan._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'agronomist',
      },
      after: (plan.toObject ? plan.toObject() : plan) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(plan, 'Nutrient schedule generated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to generate nutrient plan', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { planId, stageIndex, status } = body;

    if (!planId || stageIndex === undefined || !status) {
      return ApiResponse.badRequest('planId, stageIndex, and status are required');
    }

    const plan = await NutrientManagementModel.findById(planId);
    if (!plan) return ApiResponse.notFound('Nutrient plan not found');

    if (plan.splitApplications[stageIndex]) {
      plan.splitApplications[stageIndex].status = status;
      if (status === 'applied') {
        plan.splitApplications[stageIndex].appliedDate = new Date();
      }
      await plan.save();
    }

    return ApiResponse.success(plan, 'Dose status updated');
  } catch (error) {
    return ApiResponse.serverError('Failed to update split dose status', error);
  }
}
