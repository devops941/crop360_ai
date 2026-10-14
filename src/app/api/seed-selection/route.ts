import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SeedSelectionPlan } from '@/models/seed-selection.model';
import { INDIAN_SEEDS_CATALOG } from '@/data/seed-catalog';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const catalogOnly = searchParams.get('catalog');

    if (catalogOnly === 'true') {
      return ApiResponse.success(INDIAN_SEEDS_CATALOG);
    }

    const filter: Record<string, unknown> = {};
    if (farmerId) filter.farmerId = farmerId;

    const plans = await SeedSelectionPlan.find(filter)
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
    const body = await request.json();
    const { farmerId, farmId, cropName, varietyName, acres = 1 } = body;

    if (!farmerId || !farmId || !cropName) {
      return ApiResponse.badRequest('farmerId, farmId, and cropName are required');
    }

    // Lookup variety in catalog
    const matchedVariety =
      INDIAN_SEEDS_CATALOG.find(
        (s) =>
          (varietyName && s.varietyName.toLowerCase().includes(varietyName.toLowerCase())) ||
          s.cropName.toLowerCase().includes(cropName.toLowerCase())
      ) || INDIAN_SEEDS_CATALOG[0];

    const requiredQuantityKg = Number((matchedVariety.seedRateKgNumber * acres).toFixed(1));
    const estimatedSeedCostInr = Math.round(requiredQuantityKg * matchedVariety.costPerKgInr);

    const plan = await SeedSelectionPlan.create({
      farmerId,
      farmId,
      cropName,
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
    });

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SeedSelectionPlan',
      entityId: String(plan._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: (plan.toObject ? plan.toObject() : plan) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(plan, 'Seed selection advisory created successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to create seed selection plan', error);
  }
}
