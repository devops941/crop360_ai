import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { CropGrowthModel } from '@/models/crop-growth.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
    const sowingId = searchParams.get('sowingId');

    const filter: Record<string, unknown> = {};
    if (farmId) filter.farmId = farmId;
    if (farmerId) filter.farmerId = farmerId;
    if (sowingId) filter.sowingId = sowingId;

    const logs = await CropGrowthModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ observationDate: -1 })
      .lean();

    return ApiResponse.success(logs);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch crop growth logs', error);
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
      observationDate,
      growthStage = 'vegetative',
      plantHeightCm,
      canopyCoveragePercent,
      tillerCountPerPlant = 1,
      healthStatus = 'normal',
      photoUrl,
      remarks,
    } = body;

    if (!farmerId || !farmId || !cropName || !varietyName || plantHeightCm === undefined || canopyCoveragePercent === undefined) {
      return ApiResponse.badRequest(
        'farmerId, farmId, cropName, varietyName, plantHeightCm, and canopyCoveragePercent are required'
      );
    }

    const log = await CropGrowthModel.create({
      farmerId,
      farmId,
      sowingId: sowingId || undefined,
      cropName,
      varietyName,
      observationDate: observationDate ? new Date(observationDate) : new Date(),
      growthStage,
      plantHeightCm: Number(plantHeightCm),
      canopyCoveragePercent: Math.min(100, Math.max(0, Number(canopyCoveragePercent))),
      tillerCountPerPlant: Number(tillerCountPerPlant) || 1,
      healthStatus,
      photoUrl,
      remarks,
    });

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'CropGrowthLog',
      entityId: String(log._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'agronomist',
      },
      after: (log.toObject ? log.toObject() : log) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(log, 'Crop growth observation logged successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to record crop growth observation', error);
  }
}
