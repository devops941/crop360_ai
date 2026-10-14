import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { HarvestRecordModel } from '@/models/harvest-record.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
    const grade = searchParams.get('grade');

    const filter: Record<string, unknown> = {};
    if (farmId) filter.farmId = farmId;
    if (farmerId) filter.farmerId = farmerId;
    if (grade) filter.grainQualityGrade = grade;

    const records = await HarvestRecordModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ harvestDate: -1 })
      .lean();

    return ApiResponse.success(records);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch harvest records', error);
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
      harvestDate,
      harvestMethod = 'combine_harvester',
      totalHarvestedYieldQuintals,
      yieldPerAcreQuintals,
      moistureAtHarvestPercent = 19,
      grainQualityGrade = 'grade_a_faq',
      bagCount = 50,
      machineryRentalCostInr = 2500,
      totalHarvestCostInr = 4500,
      notes,
    } = body;

    if (!farmerId || !farmId || !cropName || !varietyName || totalHarvestedYieldQuintals === undefined) {
      return ApiResponse.badRequest(
        'farmerId, farmId, cropName, varietyName, and totalHarvestedYieldQuintals are required'
      );
    }

    const record = await HarvestRecordModel.create({
      farmerId,
      farmId,
      sowingId: sowingId || undefined,
      cropName,
      varietyName,
      harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
      harvestMethod,
      totalHarvestedYieldQuintals: Number(totalHarvestedYieldQuintals),
      yieldPerAcreQuintals: Number(yieldPerAcreQuintals) || Number(totalHarvestedYieldQuintals),
      moistureAtHarvestPercent: Number(moistureAtHarvestPercent),
      grainQualityGrade,
      bagCount: Number(bagCount),
      machineryRentalCostInr: Number(machineryRentalCostInr),
      totalHarvestCostInr: Number(totalHarvestCostInr),
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'HarvestRecord',
        entityId: String(record._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (record.toObject ? record.toObject() : record) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(record);
  } catch (error) {
    return ApiResponse.serverError('Failed to record harvest operation', error);
  }
}
