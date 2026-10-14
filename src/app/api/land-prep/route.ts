import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { LandPreparationPlan } from '@/models/land-prep.model';
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
    const body = await request.json();
    const { farmerId, farmId, cropName = 'Paddy', tillageType = 'conventional' } = body;

    if (!farmerId || !farmId) {
      return ApiResponse.badRequest('farmerId and farmId are required');
    }

    // Default operations sequence based on tillage type
    const operations =
      tillageType === 'puddled_wetland'
        ? [
            {
              stepNumber: 1,
              operationName: 'Dry Summer Ploughing',
              implementType: 'mouldboard_plough',
              targetDepthInches: 8,
              timingDaysBeforeSowing: 21,
              purpose: 'Expose soil pathogens, break hard pan, and bury previous crop stubble',
              isCompleted: false,
            },
            {
              stepNumber: 2,
              operationName: 'Basal FYM / Green Manure Incorporation',
              implementType: 'rotavator',
              targetDepthInches: 4,
              timingDaysBeforeSowing: 14,
              purpose: 'Distribute 5 tonnes/acre farmyard manure evenly across plough layer',
              isCompleted: false,
            },
            {
              stepNumber: 3,
              operationName: 'Primary & Secondary Wet Puddling',
              implementType: 'rotavator',
              targetDepthInches: 6,
              timingDaysBeforeSowing: 5,
              purpose: 'Puddle submerged soil with 5cm standing water to prevent percolation',
              isCompleted: false,
            },
            {
              stepNumber: 4,
              operationName: 'Perfect Leveling & Peripheral Bund Trimming',
              implementType: 'leveler',
              targetDepthInches: 0,
              timingDaysBeforeSowing: 1,
              purpose: 'Laser/wooden leveling board to ensure uniform 2cm water depth for transplanting',
              isCompleted: false,
            },
          ]
        : [
            {
              stepNumber: 1,
              operationName: 'Primary Deep Ploughing',
              implementType: 'mouldboard_plough',
              targetDepthInches: 9,
              timingDaysBeforeSowing: 25,
              purpose: 'Break hard soil crust, destroy perennial weed rhizomes, maximize rain absorption',
              isCompleted: false,
            },
            {
              stepNumber: 2,
              operationName: 'Disc Harrowing Clod Crushing',
              implementType: 'disc_harrow',
              targetDepthInches: 5,
              timingDaysBeforeSowing: 12,
              purpose: 'Pulverize dry clods to create granular friable soil texture',
              isCompleted: false,
            },
            {
              stepNumber: 3,
              operationName: 'Secondary Tillage & Organic Amendment Incorporation',
              implementType: 'cultivator',
              targetDepthInches: 4,
              timingDaysBeforeSowing: 5,
              purpose: 'Mix basal FYM and bio-fertilizers into seed zone',
              isCompleted: false,
            },
            {
              stepNumber: 4,
              operationName: 'Ridge and Furrow / Seedbed Formation',
              implementType: 'ridger',
              targetDepthInches: 6,
              timingDaysBeforeSowing: 2,
              purpose: 'Form uniform 60cm ridges for optimal drainage and root aeration',
              isCompleted: false,
            },
          ];

    const plan = await LandPreparationPlan.create({
      farmerId,
      farmId,
      cropName,
      tillageType,
      basalFYMApplicationTonnesPerAcre: 5,
      operations,
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

    return ApiResponse.created(plan, 'Land preparation plan created successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to create land preparation plan', error);
  }
}
