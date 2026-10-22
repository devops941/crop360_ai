import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { IrrigationScheduleModel } from '@/models/irrigation.model';
import { SowingRecord } from '@/models/sowing.model';
import { Farm } from '@/models/farm.model';
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
    const status = searchParams.get('status');

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
    if (status) filter.status = status;

    let schedules = await IrrigationScheduleModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres irrigationSource soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ scheduledDate: -1 })
      .lean();

    // Auto-generate precision irrigation schedule if none exist for active sowing
    if (schedules.length === 0) {
      try {
        const sowingFilter: Record<string, unknown> = {};
        if (!scope.isAdmin) {
          sowingFilter.farmerId = { $in: scope.farmerIds };
        }
        if (farmerId && (scope.isAdmin || scope.farmerIdStrings.includes(String(farmerId)))) {
          sowingFilter.farmerId = farmerId;
        }
        if (farmId) sowingFilter.farmId = farmId;

        const sowings = await SowingRecord.find(sowingFilter);
        for (const sow of sowings) {
          const farm = await Farm.findById(sow.farmId);
          const isDrip = farm?.irrigationSource?.toLowerCase().includes('drip');
          const method: 'drip' | 'flood' = isDrip ? 'drip' : 'flood';
          const kc = 1.05;
          const refEt = 4.8;
          const efficiency = method === 'drip' ? 1.1 : 1.6;
          const netEtc = refEt * kc * 1.0;
          const acres = farm?.totalAreaAcres || 1;
          const waterReq = Math.round(netEtc * 4047 * efficiency * acres);
          const pumpLph = 15000;
          const runTime = Math.max(30, Math.round((waterReq / pumpLph) * 60));

          await IrrigationScheduleModel.create({
            farmerId: sow.farmerId,
            farmId: sow.farmId,
            sowingId: sow._id,
            cropName: sow.cropName,
            soilMoisturePercent: 48,
            cropCoefficientKc: kc,
            referenceEtMm: refEt,
            calculatedWaterRequirementLitersPerAcre: Math.round(netEtc * 4047 * efficiency),
            irrigationMethod: method,
            pumpDischargeRateLph: pumpLph,
            scheduledRunTimeMinutes: runTime,
            scheduledDate: new Date(),
            status: 'pending',
            notes: `Automated precision water budget for ${sow.cropName} (${acres} acres)`,
          });
        }

        schedules = await IrrigationScheduleModel.find(filter)
          .populate('farmerId', 'name farmerCode phone district')
          .populate('farmId', 'parcelName surveyNumber totalAreaAcres irrigationSource soilType')
          .populate('sowingId', 'sowingDate cropName varietyName')
          .sort({ scheduledDate: -1 })
          .lean();
      } catch (autoErr) {
        console.warn('Auto irrigation schedule notice:', autoErr);
      }
    }

    return ApiResponse.success(schedules);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch irrigation schedules', error);
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
      sowingId,
      cropName = 'Paddy',
      soilMoisturePercent = 45,
      cropCoefficientKc = 0.85,
      referenceEtMm = 4.5,
      irrigationMethod = 'drip',
      pumpDischargeRateLph = 12000,
      scheduledDate,
      notes,
    } = body;

    if (!farmerId || !farmId) {
      return ApiResponse.badRequest('farmerId and farmId are required');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to schedule irrigation for this farmer');
    }

    // Agronomic ETc Calculation
    // 1 mm water per acre = 4,047 Liters
    const efficiencyFactor =
      irrigationMethod === 'drip'
        ? 1.1
        : irrigationMethod === 'sprinkler'
        ? 1.25
        : 1.6;

    const moistureDepletionRatio =
      soilMoisturePercent < 50 ? (50 - soilMoisturePercent) / 50 + 1.0 : 1.0;

    const netEtcMm = Number(referenceEtMm) * Number(cropCoefficientKc) * moistureDepletionRatio;
    const waterReqLiters = Math.round(netEtcMm * 4047 * efficiencyFactor);
    const runTimeMinutes = Math.round((waterReqLiters / Number(pumpDischargeRateLph)) * 60);

    const schedule = await IrrigationScheduleModel.create({
      farmerId,
      farmId,
      sowingId: sowingId || undefined,
      cropName,
      soilMoisturePercent: Number(soilMoisturePercent),
      cropCoefficientKc: Number(cropCoefficientKc),
      referenceEtMm: Number(referenceEtMm),
      calculatedWaterRequirementLitersPerAcre: waterReqLiters,
      irrigationMethod,
      pumpDischargeRateLph: Number(pumpDischargeRateLph),
      scheduledRunTimeMinutes: Math.max(15, runTimeMinutes),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      status: 'pending',
      notes,
    });

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'IrrigationSchedule',
      entityId: String(schedule._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: (schedule.toObject ? schedule.toObject() : schedule) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(schedule, 'Irrigation schedule generated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to generate irrigation schedule', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const body = await request.json();
    const { id, status, waterMeterReadingLiters } = body;

    if (!id || !status) {
      return ApiResponse.badRequest('id and status are required');
    }

    const schedule = await IrrigationScheduleModel.findById(id);
    if (!schedule) {
      return ApiResponse.notFound('Irrigation schedule not found');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(schedule.farmerId))) {
      return ApiResponse.forbidden('You do not have permission to update this irrigation schedule');
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'completed') {
      updateData.completedDate = new Date();
      if (waterMeterReadingLiters !== undefined) {
        updateData.waterMeterReadingLiters = Number(waterMeterReadingLiters);
      }
    }

    const updated = await IrrigationScheduleModel.findByIdAndUpdate(id, updateData, { new: true });

    return ApiResponse.success(updated, 'Schedule updated');
  } catch (error) {
    return ApiResponse.serverError('Failed to update irrigation schedule', error);
  }
}
