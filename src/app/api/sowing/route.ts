import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SowingRecord } from '@/models/sowing.model';
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
    const body = await request.json();
    const {
      farmerId,
      farmId,
      cropName,
      varietyName,
      sowingDate,
      plantingMethod = 'transplanting',
      rowToRowCm = 20,
      plantToPlantCm = 15,
      nurseryAgeDays = 21,
      actualSeedRateUsedKg = 18,
      durationDays = 120,
    } = body;

    if (!farmerId || !farmId || !cropName || !varietyName) {
      return ApiResponse.badRequest('farmerId, farmId, cropName, and varietyName are required');
    }

    // 1 Acre = 4046.86 sq meters = 40,468,600 sq cm
    const areaPerPlantSqCm = rowToRowCm * plantToPlantCm;
    const plantPopulationPerAcre = Math.round(40468600 / areaPerPlantSqCm);

    const sowingDateTime = sowingDate ? new Date(sowingDate) : new Date();
    const targetHarvest = new Date(sowingDateTime);
    targetHarvest.setDate(targetHarvest.getDate() + (parseInt(durationDays, 10) || 120));

    const record = await SowingRecord.create({
      farmerId,
      farmId,
      cropName,
      varietyName,
      sowingDate: sowingDateTime,
      plantingMethod,
      spacingCm: {
        rowToRowCm,
        plantToPlantCm,
      },
      plantPopulationPerAcre,
      nurseryAgeDays: plantingMethod === 'transplanting' ? nurseryAgeDays : undefined,
      targetHarvestDateEstimated: targetHarvest,
      actualSeedRateUsedKg,
      depthOfSowingCm: plantingMethod === 'transplanting' ? 2 : 3,
      status: 'sown',
    });

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
