import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { CropProtectionModel } from '@/models/crop-protection.model';
import { PestDetectionModel } from '@/models/pest-detection.model';
import { SowingRecord } from '@/models/sowing.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { getTenantScope } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
    const detectionId = searchParams.get('detectionId');
    const sprayStatus = searchParams.get('status');

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
    if (detectionId) filter.detectionId = detectionId;
    if (sprayStatus) filter.sprayStatus = sprayStatus;

    let prescriptions = await CropProtectionModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('detectionId', 'pestDiseaseName severityLevel confidenceScorePercent')
      .sort({ createdAt: -1 })
      .lean();

    // Auto-generate certified IPM bio-spray prescription if none exist for active sowing
    if (prescriptions.length === 0) {
      try {
        const sowingFilter: Record<string, unknown> = {};
        if (!scope.isAdmin) sowingFilter.farmerId = { $in: scope.farmerIds };
        if (farmerId && (scope.isAdmin || scope.farmerIdStrings.includes(String(farmerId)))) sowingFilter.farmerId = farmerId;
        if (farmId) sowingFilter.farmId = farmId;

        const sowings = await SowingRecord.find(sowingFilter);
        for (const sow of sowings) {
          const det = await PestDetectionModel.findOne({ farmId: sow.farmId });
          await CropProtectionModel.create({
            farmerId: sow.farmerId,
            farmId: sow.farmId,
            detectionId: det?._id || undefined,
            cropName: sow.cropName,
            targetPestOrDisease: det?.pestDiseaseName || 'Stem Borer & Leaf Blast Prophylaxis',
            controlStrategy: 'integrated',
            recommendedFormulation: 'Neem Azadirachtin 1500 PPM + Trichoderma Viride Bio-fungicide',
            cibrcRegistrationNumber: 'CIBRC-BIO-REG-2024',
            dilutionDosagePerLiter: '3.0 ml / L water',
            sprayVolumeLitersPerAcre: 200,
            waitingPeriodDaysPHI: 7,
            safetyPrecautions: [
              'Wear protective masks and nitrile gloves during spray formulation',
              'Spray strictly during calm morning (7 AM - 9 AM) or evening hours',
              'Do not mix with harsh alkaline copper oxychloride chemicals',
            ],
            applicationMethod: 'knapsack_spray',
            sprayStatus: 'recommended',
            scheduledSprayDate: new Date(),
            estimatedCostInrPerAcre: 550,
            notes: `Certified bio-pesticide prophylaxis for ${sow.cropName}`,
          });
        }

        prescriptions = await CropProtectionModel.find(filter)
          .populate('farmerId', 'name farmerCode phone district')
          .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
          .populate('detectionId', 'pestDiseaseName severityLevel confidenceScorePercent')
          .sort({ createdAt: -1 })
          .lean();
      } catch (autoErr) {
        console.warn('Auto crop protection notice:', autoErr);
      }
    }

    return ApiResponse.success(prescriptions);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch crop protection plans', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
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

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to create protection plans for this farmer');
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
    const scope = await getTenantScope(request);
    const body = await request.json();
    const { id, sprayStatus, completedDate } = body;

    if (!id || !sprayStatus) {
      return ApiResponse.badRequest('id and sprayStatus are required');
    }

    const prescription = await CropProtectionModel.findById(id);
    if (!prescription) {
      return ApiResponse.notFound('Crop protection prescription not found');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(prescription.farmerId))) {
      return ApiResponse.forbidden('You do not have permission to update this crop protection plan');
    }

    const update: Record<string, unknown> = { sprayStatus };
    if (completedDate || sprayStatus === 'completed') {
      update.completedDate = completedDate ? new Date(completedDate) : new Date();
    }

    const updated = await CropProtectionModel.findByIdAndUpdate(id, update, { new: true });

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
