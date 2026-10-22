import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SowingRecord } from '@/models/sowing.model';
import { SowingGeneratorService } from '@/services/sowing-generator.service';
import { CropRecommendationPlan } from '@/models/crop-recommendation.model';
import { LandPreparationPlan } from '@/models/land-prep.model';
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

    const records = await SowingRecord.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .sort({ sowingDate: -1 })
      .lean();

    return ApiResponse.success(records);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch sowing records', error);
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
      cropName,
      varietyName,
      sowingDate,
      plantingMethod,
      rowToRowCm,
      plantToPlantCm,
      nurseryAgeDays,
      actualSeedRateUsedKg,
      durationDays,
      status: requestedStatus,
    } = body;

    if (!farmerId || !farmId || !cropName) {
      return ApiResponse.badRequest('farmerId, farmId, and cropName are required');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to log sowing records for this farmer');
    }

    const spec = SowingGeneratorService.getSpec(cropName);
    const finalVariety = varietyName || spec.varietyName;
    const finalMethod = plantingMethod || spec.plantingMethod;
    const finalRowCm = Number(rowToRowCm) || spec.spacingCm.rowToRowCm;
    const finalPlantCm = Number(plantToPlantCm) || spec.spacingCm.plantToPlantCm;
    const finalDuration = parseInt(durationDays, 10) || spec.durationDays;
    const finalSeedRate = Number(actualSeedRateUsedKg) || spec.actualSeedRateUsedKg;
    const finalDepth = spec.depthOfSowingCm;
    const finalNurseryAge = nurseryAgeDays || spec.nurseryAgeDays;
    const finalStatus = requestedStatus || 'sown';

    // 1 Acre = 4046.86 sq meters = 40,468,600 sq cm
    const areaPerPlantSqCm = finalRowCm * finalPlantCm;
    const plantPopulationPerAcre = Math.round(40468600 / areaPerPlantSqCm);

    const sowingDateTime = sowingDate ? new Date(sowingDate) : new Date();
    const targetHarvest = new Date(sowingDateTime);
    targetHarvest.setDate(targetHarvest.getDate() + finalDuration);

    const record = await SowingRecord.create({
      farmerId,
      farmId,
      cropName,
      varietyName: finalVariety,
      sowingDate: sowingDateTime,
      plantingMethod: finalMethod,
      spacingCm: {
        rowToRowCm: finalRowCm,
        plantToPlantCm: finalPlantCm,
      },
      plantPopulationPerAcre,
      nurseryAgeDays: finalMethod === 'transplanting' ? finalNurseryAge : undefined,
      targetHarvestDateEstimated: targetHarvest,
      actualSeedRateUsedKg: finalSeedRate,
      depthOfSowingCm: finalDepth,
      status: finalStatus,
    });

    // Synchronize Cultivation Lifecycle across Collections
    try {
      await CropRecommendationPlan.updateMany(
        { farmId, farmerId },
        { status: 'in_cultivation', selectedCrop: cropName }
      );
      if (finalStatus === 'sown' || finalStatus === 'germination_verified') {
        await LandPreparationPlan.updateMany(
          { farmId, farmerId },
          { status: 'completed' }
        );
      }
      await Farm.findByIdAndUpdate(farmId, { status: 'active' });
    } catch (syncErr) {
      console.warn('Lifecycle sync notice:', syncErr);
    }

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SowingRecord',
      entityId: String(record._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: (record.toObject ? record.toObject() : record) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(record, 'Sowing & planting record logged successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to record sowing operation', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const body = await request.json();
    const { id, status, notes, varietyName, plantingMethod, rowToRowCm, plantToPlantCm, actualSeedRateUsedKg } = body;

    if (!id) {
      return ApiResponse.badRequest('Sowing record id is required');
    }

    const record = await SowingRecord.findById(id);
    if (!record) {
      return ApiResponse.notFound('Sowing record not found');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(record.farmerId))) {
      return ApiResponse.forbidden('You do not have permission to modify this sowing record');
    }

    if (status) {
      record.status = status;
    }
    if (notes !== undefined) {
      record.notes = notes;
    }
    if (varietyName) {
      record.varietyName = varietyName;
    }
    if (plantingMethod) {
      record.plantingMethod = plantingMethod;
    }
    if (rowToRowCm && plantToPlantCm) {
      record.spacingCm = {
        rowToRowCm: Number(rowToRowCm),
        plantToPlantCm: Number(plantToPlantCm),
      };
      const areaPerPlantSqCm = Number(rowToRowCm) * Number(plantToPlantCm);
      record.plantPopulationPerAcre = Math.round(40468600 / areaPerPlantSqCm);
    }
    if (actualSeedRateUsedKg !== undefined) {
      record.actualSeedRateUsedKg = Number(actualSeedRateUsedKg);
    }

    await record.save();

    // Synchronize statuses across Cultivation Lifecycle
    try {
      await CropRecommendationPlan.updateMany(
        { farmId: record.farmId, farmerId: record.farmerId },
        { status: 'in_cultivation', selectedCrop: record.cropName }
      );
      if (record.status === 'sown' || record.status === 'germination_verified') {
        await LandPreparationPlan.updateMany(
          { farmId: record.farmId, farmerId: record.farmerId },
          { status: 'completed' }
        );
      }
      await Farm.findByIdAndUpdate(record.farmId, { status: 'active' });
    } catch (syncErr) {
      console.warn('Lifecycle sync notice on PATCH:', syncErr);
    }

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SowingRecord',
      entityId: String(record._id),
      action: 'UPDATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: {
        id,
        status: record.status,
      },
    });

    return ApiResponse.success(record, `Sowing record status updated to ${record.status}`);
  } catch (error) {
    return ApiResponse.serverError('Failed to update sowing record', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Sowing record id is required');
    }

    const record = await SowingRecord.findById(id);
    if (!record) {
      return ApiResponse.notFound('Sowing record not found');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(record.farmerId))) {
      return ApiResponse.forbidden('You do not have permission to delete this sowing record');
    }

    await SowingRecord.findByIdAndDelete(id);

    return ApiResponse.success(null, 'Sowing record deleted successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to delete sowing record', error);
  }
}
