import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { CropProtectionModel } from '@/models/crop-protection.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
    const detectionId = searchParams.get('detectionId');
    const sprayStatus = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (farmId) filter.farmId = farmId;
    if (farmerId) filter.farmerId = farmerId;
    if (detectionId) filter.detectionId = detectionId;
    if (sprayStatus) filter.sprayStatus = sprayStatus;

    const prescriptions = await CropProtectionModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('detectionId', 'pestDiseaseName severityLevel confidenceScorePercent')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(prescriptions);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch crop protection plans', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      farmerId,
      farmId,
      detectionId,
      cropName,
      targetPestOrDisease,
      controlStrategy = 'integrated',
      recommendedFormulation,
      cibrcRegistrationNumber = 'CIBRC-REG-CERTIFIED',
      dilutionDosagePerLiter = '2.5 ml / L',
      sprayVolumeLitersPerAcre = 200,
      waitingPeriodDaysPHI = 7,
      safetyPrecautions,
      applicationMethod = 'knapsack_spray',
      sprayStatus = 'recommended',
      scheduledSprayDate,
      estimatedCostInrPerAcre = 650,
      notes,
    } = body;

    if (!farmerId || !farmId || !cropName || !targetPestOrDisease || !recommendedFormulation) {
      return ApiResponse.badRequest(
        'farmerId, farmId, cropName, targetPestOrDisease, and recommendedFormulation are required'
      );
    }

    const plan = await CropProtectionModel.create({
      farmerId,
      farmId,
      detectionId: detectionId || undefined,
      cropName,
      targetPestOrDisease,
      controlStrategy,
      recommendedFormulation,
      cibrcRegistrationNumber,
      dilutionDosagePerLiter,
      sprayVolumeLitersPerAcre: Number(sprayVolumeLitersPerAcre),
      waitingPeriodDaysPHI: Number(waitingPeriodDaysPHI),
      safetyPrecautions: safetyPrecautions || [
        'Wear protective gloves and respirator mask',
        'Spray during early morning or calm evening hours',
        'Observe minimum Pre-Harvest Interval (PHI) before picking',
      ],
      applicationMethod,
      sprayStatus,
      scheduledSprayDate: scheduledSprayDate ? new Date(scheduledSprayDate) : undefined,
      estimatedCostInrPerAcre: Number(estimatedCostInrPerAcre) || 650,
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'CropProtection',
        entityId: String(plan._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (plan.toObject ? plan.toObject() : plan) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(plan);
  } catch (error) {
    return ApiResponse.serverError('Failed to create crop protection prescription', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, sprayStatus, completedDate } = body;

    if (!id || !sprayStatus) {
      return ApiResponse.badRequest('id and sprayStatus are required');
    }

    const update: Record<string, unknown> = { sprayStatus };
    if (completedDate || sprayStatus === 'completed') {
      update.completedDate = completedDate ? new Date(completedDate) : new Date();
    }

    const updated = await CropProtectionModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return ApiResponse.notFound('Crop protection prescription not found');
    }

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'CropProtection',
        entityId: id,
        action: 'UPDATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: { newSprayStatus: sprayStatus },
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.success(updated);
  } catch (error) {
    return ApiResponse.serverError('Failed to update spray prescription status', error);
  }
}
