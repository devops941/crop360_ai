import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { CropRecommendationPlan } from '@/models/crop-recommendation.model';
import { SeedSelectionPlan } from '@/models/seed-selection.model';
import { SeedCatalogItem } from '@/models/seed-catalog.model';
import { INDIAN_SEEDS_CATALOG } from '@/data/seed-catalog';
import { LandPreparationPlan } from '@/models/land-prep.model';
import { LandPrepGeneratorService } from '@/services/land-prep-generator.service';
import { Farm } from '@/models/farm.model';
import { SoilReport } from '@/models/soil-report.model';
import { CropSuitabilityEngine } from '@/services/crop-suitability.service';
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
          return ApiResponse.success([]);
        }
      } else {
        filter.farmerId = { $in: scope.farmerIds };
      }

      if (farmId) {
        if (scope.farmIdStrings.includes(String(farmId))) {
          filter.farmId = farmId;
        } else {
          return ApiResponse.success([]);
        }
      }
    } else {
      if (farmerId) filter.farmerId = farmerId;
      if (farmId) filter.farmId = farmId;
    }

    let plans = await CropRecommendationPlan.find(filter)
      .populate('farmerId', 'name farmerCode phone district state')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType irrigationSource')
      .sort({ createdAt: -1 })
      .lean();

    // Auto-generate crop suitability plans if none exist for registered farms
    if (plans.length === 0) {
      try {
        const farmQuery: Record<string, unknown> = {};
        if (farmId) farmQuery._id = farmId;
        if (farmerId) farmQuery.farmerId = farmerId;
        if (!scope.isAdmin && !farmerId) {
          farmQuery.farmerId = { $in: scope.farmerIds };
        }

        const registeredFarms = await Farm.find(farmQuery);
        for (const fm of registeredFarms) {
          const report = await SoilReport.findOne({ farmId: fm._id }).sort({ createdAt: -1 });

          const evaluatedRecommendations = CropSuitabilityEngine.evaluateCrops({
            soilType: fm.soilType,
            irrigationSource: fm.irrigationSource || 'borewell',
            waterAvailabilityMonths: fm.waterAvailabilityMonths || 8,
            parameters: report?.parameters,
            season: 'kharif',
          });

          await CropRecommendationPlan.create({
            farmerId: fm.farmerId,
            farmId: fm._id,
            soilReportId: report?._id,
            targetSeason: 'kharif',
            targetYear: new Date().getFullYear(),
            marketPriceTrendsSummary:
              'APMC terminal market arrivals stable with firm wholesale price realizations.',
            recommendations: evaluatedRecommendations,
            selectedCrop: evaluatedRecommendations[0]?.cropName || 'Paddy (Rice / Samba / Kuruvai)',
            status: 'confirmed',
          });
        }

        plans = await CropRecommendationPlan.find(filter)
          .populate('farmerId', 'name farmerCode phone district state')
          .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType irrigationSource')
          .sort({ createdAt: -1 })
          .lean();
      } catch (autoErr) {
        console.warn('Auto crop suitability generation notice:', autoErr);
      }
    }

    return ApiResponse.success(plans);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch crop recommendation plans', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { farmerId, farmId, soilReportId, targetSeason } = body;

    if (!farmerId || !farmId) {
      return ApiResponse.badRequest('farmerId and farmId are required');
    }

    const farm = await Farm.findById(farmId);
    if (!farm) {
      return ApiResponse.notFound('Farm parcel not found');
    }

    let reportParams = undefined;
    if (soilReportId) {
      const report = await SoilReport.findById(soilReportId);
      if (report && report.parameters) {
        reportParams = report.parameters;
      }
    } else {
      const latestReport = await SoilReport.findOne({ farmId }).sort({ createdAt: -1 });
      if (latestReport && latestReport.parameters) {
        reportParams = latestReport.parameters;
      }
    }

    const evaluatedRecommendations = CropSuitabilityEngine.evaluateCrops({
      soilType: farm.soilType,
      irrigationSource: farm.irrigationSource || 'borewell',
      waterAvailabilityMonths: farm.waterAvailabilityMonths || 8,
      parameters: reportParams,
      season: targetSeason || 'kharif',
    });

    const plan = await CropRecommendationPlan.create({
      farmerId,
      farmId,
      soilReportId: soilReportId || undefined,
      targetSeason: targetSeason || 'kharif',
      targetYear: new Date().getFullYear(),
      marketPriceTrendsSummary: 'APMC terminal market arrivals stable with firm wholesale price realizations.',
      recommendations: evaluatedRecommendations,
      selectedCrop: evaluatedRecommendations[0]?.cropName || 'Paddy (Rice / Samba / Kuruvai)',
      status: 'confirmed',
    });

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'CropRecommendationPlan',
      entityId: String(plan._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: (plan.toObject ? plan.toObject() : plan) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(plan, 'Crop recommendation plan generated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to generate crop recommendation plan', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { planId, selectedCrop } = body;

    if (!planId || !selectedCrop) {
      return ApiResponse.badRequest('planId and selectedCrop are required');
    }

    const plan = await CropRecommendationPlan.findById(planId);
    if (!plan) {
      return ApiResponse.notFound('Crop recommendation plan not found');
    }

    plan.selectedCrop = selectedCrop;
    await plan.save();

    // Automatically synchronize the SeedSelectionPlan for this farm parcel
    try {
      const allDbSeeds = await SeedCatalogItem.find({ isActive: true }).lean();
      const catalogList = allDbSeeds.length > 0 ? allDbSeeds : INDIAN_SEEDS_CATALOG;
      const normTarget = selectedCrop.toLowerCase();
      const matchedVariety =
        catalogList.find(
          (s) =>
            s.cropName.toLowerCase().includes(normTarget) ||
            normTarget.includes(s.cropName.toLowerCase())
        ) || catalogList[0];

      const farm = await Farm.findById(plan.farmId);
      const acres = farm?.totalAreaAcres || 1;
      const requiredQuantityKg = Number((matchedVariety.seedRateKgNumber * acres).toFixed(1));
      const estimatedSeedCostInr = Math.round(requiredQuantityKg * matchedVariety.costPerKgInr);

      await SeedSelectionPlan.findOneAndUpdate(
        { farmId: plan.farmId, farmerId: plan.farmerId },
        {
          cropName: selectedCrop,
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
    } catch (syncErr) {
      console.warn('Notice: Seed plan sync notice:', syncErr);
    }

    // Automatically synchronize LandPreparationPlan for this farm parcel using Crop-Specific Generator
    try {
      const farm = await Farm.findById(plan.farmId);
      const generated = await LandPrepGeneratorService.generate(
        selectedCrop,
        farm?.soilType || 'loam',
        plan.targetSeason || 'Kharif'
      );

      await LandPreparationPlan.findOneAndUpdate(
        { farmId: plan.farmId, farmerId: plan.farmerId },
        {
          cropName: selectedCrop,
          season: `${plan.targetSeason || 'Kharif'} ${plan.targetYear || 2026}`,
          tillageType: generated.tillageType,
          basalFYMApplicationTonnesPerAcre: generated.basalFYMApplicationTonnesPerAcre,
          soilAmendmentRequired: generated.soilAmendmentRequired,
          operations: generated.operations,
          readinessScorePercent: 0,
          status: 'planning',
        },
        { upsert: true, new: true }
      );
    } catch (landErr) {
      console.warn('Notice: Land prep sync notice:', landErr);
    }

    return ApiResponse.success(plan, `Selected crop updated to ${selectedCrop}`);
  } catch (error) {
    return ApiResponse.serverError('Failed to update crop plan', error);
  }
}
