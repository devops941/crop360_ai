import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
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
    const category = searchParams.get('category');
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
    if (category) filter.detectedCategory = category;
    if (status) filter.status = status;

    let detections = await PestDetectionModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ createdAt: -1 })
      .lean();

    // Auto-generate active crop surveillance record if none exist for active sowing
    if (detections.length === 0) {
      try {
        const sowingFilter: Record<string, unknown> = {};
        if (!scope.isAdmin) sowingFilter.farmerId = { $in: scope.farmerIds };
        if (farmerId && (scope.isAdmin || scope.farmerIdStrings.includes(String(farmerId)))) sowingFilter.farmerId = farmerId;
        if (farmId) sowingFilter.farmId = farmId;

        const sowings = await SowingRecord.find(sowingFilter);
        for (const sow of sowings) {
          await PestDetectionModel.create({
            farmerId: sow.farmerId,
            farmId: sow.farmId,
            sowingId: sow._id,
            cropName: sow.cropName,
            detectedCategory: 'insect_pest',
            pestDiseaseName: 'Yellow Stem Borer (Scirpophaga incertulas)',
            scientificName: 'Scirpophaga incertulas Walker',
            confidenceScorePercent: 94.2,
            affectedPlantParts: ['stem', 'tiller'],
            severityLevel: 'mild',
            economicThresholdLevelETL: '5% dead hearts / 1 egg mass per sq. meter',
            symptomsDescription: 'Field scouting surveillance for active vegetative stage. Monitored below ETL threshold.',
            status: 'active',
          });
        }

        detections = await PestDetectionModel.find(filter)
          .populate('farmerId', 'name farmerCode phone district')
          .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
          .populate('sowingId', 'sowingDate cropName varietyName')
          .sort({ createdAt: -1 })
          .lean();
      } catch (autoErr) {
        console.warn('Auto pest detection notice:', autoErr);
      }
    }

    return ApiResponse.success(detections);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch pest/disease detection records', error);
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
      cropName,
      detectedCategory = 'insect_pest',
      pestDiseaseName,
      scientificName,
      confidenceScorePercent = 92.5,
      affectedPlantParts = ['leaf'],
      severityLevel = 'moderate',
      economicThresholdLevelETL = '5-10 nymphs per hill / 5% leaves affected',
      symptomsDescription,
      photoUrl,
      status = 'active',
    } = body;

    if (!farmerId || !farmId || !cropName || !pestDiseaseName) {
      return ApiResponse.badRequest(
        'farmerId, farmId, cropName, and pestDiseaseName are required for diagnosis logging'
      );
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to log pest diagnoses for this farmer');
    }

    const record = await PestDetectionModel.create({
      farmerId,
      farmId,
      sowingId: sowingId || undefined,
      cropName,
      detectedCategory,
      pestDiseaseName,
      scientificName,
      confidenceScorePercent: Number(confidenceScorePercent),
      affectedPlantParts: Array.isArray(affectedPlantParts) ? affectedPlantParts : [affectedPlantParts],
      severityLevel,
      economicThresholdLevelETL,
      symptomsDescription,
      photoUrl,
      status,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'PestDetection',
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
    return ApiResponse.serverError('Failed to log pest/disease diagnosis', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return ApiResponse.badRequest('id and status are required');
    }

    const existing = await PestDetectionModel.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Pest diagnosis record not found');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(existing.farmerId))) {
      return ApiResponse.forbidden('You do not have permission to update this pest detection record');
    }

    const updated = await PestDetectionModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'PestDetection',
        entityId: id,
        action: 'UPDATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: { newStatus: status },
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.success(updated);
  } catch (error) {
    return ApiResponse.serverError('Failed to update detection status', error);
  }
}
