import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { IrrigationScheduleModel } from '@/models/irrigation.model';
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
    if (status) filter.status = status;

    const schedules = await IrrigationScheduleModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres irrigationSource soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ scheduledDate: -1 })
      .lean();

    return ApiResponse.success(schedules);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch irrigation schedules', error);
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
    const body = await request.json();
    const { id, status, waterMeterReadingLiters } = body;

    if (!id || !status) {
      return ApiResponse.badRequest('id and status are required');
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
    if (!updated) {
      return ApiResponse.notFound('Irrigation schedule not found');
    }

    return ApiResponse.success(updated, 'Schedule updated');
  } catch (error) {
    return ApiResponse.serverError('Failed to update irrigation schedule', error);
  }
}
