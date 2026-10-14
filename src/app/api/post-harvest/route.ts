import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { PostHarvestModel } from '@/models/post-harvest.model';
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

    const records = await PostHarvestModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('harvestId', 'cropName varietyName totalHarvestedYieldQuintals moistureAtHarvestPercent')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(records);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch post-harvest conditioning logs', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      farmerId,
      farmId,
      harvestId,
      cropName,
      dryingMethod = 'tarpaulin_sun_drying',
      initialMoisturePercent = 19.5,
      finalMoisturePercent = 13.0,
      foreignMatterPercent = 0.8,
      brokenGrainPercent = 1.2,
      netMarketableWeightQuintals,
      cleaningLossPercent = 2.0,
      status = 'conditioning',
      notes,
    } = body;

    if (!farmerId || !farmId || !cropName || netMarketableWeightQuintals === undefined) {
      return ApiResponse.badRequest(
        'farmerId, farmId, cropName, and netMarketableWeightQuintals are required'
      );
    }

    const certNum = `QC-${Date.now().toString().slice(-6)}`;

    const record = await PostHarvestModel.create({
      farmerId,
      farmId,
      harvestId: harvestId || undefined,
      cropName,
      dryingMethod,
      initialMoisturePercent: Number(initialMoisturePercent),
      finalMoisturePercent: Number(finalMoisturePercent),
      foreignMatterPercent: Number(foreignMatterPercent),
      brokenGrainPercent: Number(brokenGrainPercent),
      netMarketableWeightQuintals: Number(netMarketableWeightQuintals),
      cleaningLossPercent: Number(cleaningLossPercent),
      qualityCertificateGenerated: true,
      certificateNumber: certNum,
      status,
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'PostHarvest',
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
    return ApiResponse.serverError('Failed to record post-harvest conditioning', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, status, certificateNumber } = body;

    if (!id || !status) {
      return ApiResponse.badRequest('id and status are required');
    }

    const update: Record<string, unknown> = { status };
    if (certificateNumber) {
      update.certificateNumber = certificateNumber;
      update.qualityCertificateGenerated = true;
    }

    const updated = await PostHarvestModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return ApiResponse.notFound('Post-harvest conditioning record not found');
    }

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'PostHarvest',
        entityId: id,
        action: 'UPDATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: { status },
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.success(updated);
  } catch (error) {
    return ApiResponse.serverError('Failed to update conditioning status', error);
  }
}
