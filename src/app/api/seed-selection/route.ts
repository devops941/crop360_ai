import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SeedSelectionPlan } from '@/models/seed-selection.model';
import { CropRecommendationPlan } from '@/models/crop-recommendation.model';
import { SeedCatalogItem } from '@/models/seed-catalog.model';
import { Farm } from '@/models/farm.model';
import { INDIAN_SEEDS_CATALOG } from '@/data/seed-catalog';
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
    const catalogOnly = searchParams.get('catalog');

    if (catalogOnly === 'true') {
      const dbCatalog = scope.userId
        ? await SeedCatalogItem.find({ userId: scope.userId, isActive: true }).sort({ cropName: 1 }).lean()
        : [];
      return ApiResponse.success(dbCatalog);
    }

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

    const cropName = searchParams.get('cropName');

    // Auto-generate or synchronize seed recommendations with the latest selected crop
    try {
      const cropPlans = await CropRecommendationPlan.find(filter);
      const allDbSeeds = scope.userId
        ? await SeedCatalogItem.find({ userId: scope.userId, isActive: true }).lean()
        : [];
      const catalogList = allDbSeeds.length > 0 ? allDbSeeds : INDIAN_SEEDS_CATALOG;

      for (const cp of cropPlans) {
        const targetCrop = cropName || cp.selectedCrop || cp.recommendations?.[0]?.cropName || 'Paddy (Rice / Samba / Kuruvai)';
        const normTarget = targetCrop.toLowerCase();

        const existingPlan = await SeedSelectionPlan.findOne({ farmId: cp.farmId, farmerId: cp.farmerId });
        const isOutOfSync = !existingPlan || existingPlan.cropName.toLowerCase() !== normTarget;

        if (isOutOfSync) {
          const matchedVariety =
            catalogList.find(
              (s) =>
                s.cropName.toLowerCase().includes(normTarget) ||
                normTarget.includes(s.cropName.toLowerCase())
            ) || catalogList[0];

          const farm = await Farm.findById(cp.farmId);
          const acres = farm?.totalAreaAcres || 1;
          const requiredQuantityKg = Number((matchedVariety.seedRateKgNumber * acres).toFixed(1));
          const estimatedSeedCostInr = Math.round(requiredQuantityKg * matchedVariety.costPerKgInr);

          await SeedSelectionPlan.findOneAndUpdate(
            { farmId: cp.farmId, farmerId: cp.farmerId },
            {
              cropName: targetCrop,
              selectedVariety: {
                varietyName: matchedVariety.varietyName,
                sourceBreeder: matchedVariety.sourceBreeder,
                seedCategory: matchedVariety.seedCategory,
                germinationRatePercent: matchedVariety.germinationRatePercent,
                seedRatePerAcreKg: matchedVariety.seedRatePerAcreKg,
                seedTreatmentAdvisory: matchedVariety.seedTreatmentAdvisory,
                durationDays: matchedVariety.durationDays,
                pestResistanceTraits: matchedVariety.pestResistanceTraits,
              },
              requiredQuantityKg,
              estimatedSeedCostInr,
              procurementSource: 'State Agricultural Extension Depot / PACS',
              status: 'recommended',
            },
            { upsert: true, new: true }
          );
        }
      }
    } catch (autoErr) {
      console.warn('Seed recommendation synchronization notice:', autoErr);
    }

    let plans = await SeedSelectionPlan.find(filter)
      .populate('farmerId', 'name farmerCode phone district state')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(plans);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch seed plans', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const body = await request.json();
    const { farmerId, farmId, cropName, varietyName, acres, customVariety } = body;

    if (!farmerId || !farmId) {
      return ApiResponse.badRequest('farmerId and farmId are required');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to manage seed selection for this farmer');
    }

    const farm = await Farm.findById(farmId);
    const farmAcres = acres || farm?.totalAreaAcres || 1;

    // Fetch database catalog
    const allDbSeeds = scope.userId
      ? await SeedCatalogItem.find({ userId: scope.userId, isActive: true }).lean()
      : [];
    const catalogList = allDbSeeds.length > 0 ? allDbSeeds : INDIAN_SEEDS_CATALOG;

    let matchedVariety = customVariety;

    if (!matchedVariety) {
      if (varietyName) {
        matchedVariety = catalogList.find(
          (s) => s.varietyName.toLowerCase() === varietyName.toLowerCase()
        );
      }
      if (!matchedVariety && cropName) {
        matchedVariety = catalogList.find(
          (s) =>
            s.cropName.toLowerCase().includes(cropName.toLowerCase()) ||
            cropName.toLowerCase().includes(s.cropName.toLowerCase())
        );
      }
      if (!matchedVariety) {
        matchedVariety = catalogList[0];
      }
    }

    const seedRateNumber = matchedVariety.seedRateKgNumber || parseFloat(matchedVariety.seedRatePerAcreKg) || 10;
    const requiredQuantityKg = Number((seedRateNumber * farmAcres).toFixed(1));
    const estimatedSeedCostInr = Math.round(requiredQuantityKg * (matchedVariety.costPerKgInr || 50));

    // Update existing plan for this farmer & farm or create new
    const existingPlan = await SeedSelectionPlan.findOne({ farmerId, farmId });

    let plan;
    if (existingPlan) {
      existingPlan.cropName = cropName || matchedVariety.cropName;
      existingPlan.selectedVariety = {
        varietyName: matchedVariety.varietyName,
        sourceBreeder: matchedVariety.sourceBreeder,
        seedCategory: matchedVariety.seedCategory,
        germinationRatePercent: matchedVariety.germinationRatePercent,
        seedRatePerAcreKg: matchedVariety.seedRatePerAcreKg,
        seedTreatmentAdvisory: matchedVariety.seedTreatmentAdvisory,
        durationDays: matchedVariety.durationDays,
        pestResistanceTraits: matchedVariety.pestResistanceTraits || [],
      };
      existingPlan.requiredQuantityKg = requiredQuantityKg;
      existingPlan.estimatedSeedCostInr = estimatedSeedCostInr;
      existingPlan.status = 'recommended';
      plan = await existingPlan.save();
    } else {
      plan = await SeedSelectionPlan.create({
        farmerId,
        farmId,
        cropName: cropName || matchedVariety.cropName,
        selectedVariety: {
          varietyName: matchedVariety.varietyName,
          sourceBreeder: matchedVariety.sourceBreeder,
          seedCategory: matchedVariety.seedCategory,
          germinationRatePercent: matchedVariety.germinationRatePercent,
          seedRatePerAcreKg: matchedVariety.seedRatePerAcreKg,
          seedTreatmentAdvisory: matchedVariety.seedTreatmentAdvisory,
          durationDays: matchedVariety.durationDays,
          pestResistanceTraits: matchedVariety.pestResistanceTraits || [],
        },
        requiredQuantityKg,
        estimatedSeedCostInr,
        procurementSource: 'State Agricultural Extension Depot / PACS',
        status: 'recommended',
      });
    }

    const populatedPlan = await SeedSelectionPlan.findById(plan._id)
      .populate('farmerId', 'name farmerCode phone district state')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres')
      .lean();

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SeedSelectionPlan',
      entityId: String(plan._id),
      action: existingPlan ? 'UPDATE' : 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: (plan.toObject ? plan.toObject() : plan) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(populatedPlan, 'Seed selection advisory saved successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to save seed selection plan', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');

    if (!planId) {
      return ApiResponse.badRequest('Seed plan ID is required');
    }

    const plan = await SeedSelectionPlan.findById(planId);
    if (!plan) {
      return ApiResponse.notFound('Seed plan not found');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(plan.farmerId))) {
      return ApiResponse.forbidden('You do not have permission to delete this seed plan');
    }

    await SeedSelectionPlan.findByIdAndDelete(planId);
    return ApiResponse.success({ deleted: true }, 'Seed plan deleted successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to delete seed plan', error);
  }
}
