import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { CropPnlModel } from '@/models/crop-pnl.model';
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
    const season = searchParams.get('season');

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
    if (season) filter.season = season;

    const ledgers = await CropPnlModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(ledgers);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch cultivation P&L statements', error);
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
      varietyName,
      season = 'Samba / Kharif',
      areaAcres = 1.0,
      costBreakdown,
      grossMandiRevenueInr,
      totalYieldQuintals = 25.0,
      notes,
    } = body;

    if (!farmerId || !farmId || !cropName || !varietyName || !costBreakdown || grossMandiRevenueInr === undefined) {
      return ApiResponse.badRequest(
        'farmerId, farmId, cropName, varietyName, costBreakdown, and grossMandiRevenueInr are required'
      );
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to record cultivation P&L for this farmer');
    }

    const {
      seedCost = 0,
      landPrepCost = 0,
      fertilizerNutrientCost = 0,
      cropProtectionCost = 0,
      irrigationCost = 0,
      laborCost = 0,
      harvestingCost = 0,
      logisticsCost = 0,
    } = costBreakdown;

    const totalCost =
      Number(seedCost) +
      Number(landPrepCost) +
      Number(fertilizerNutrientCost) +
      Number(cropProtectionCost) +
      Number(irrigationCost) +
      Number(laborCost) +
      Number(harvestingCost) +
      Number(logisticsCost);

    const grossRev = Number(grossMandiRevenueInr);
    const netProfit = grossRev - totalCost;
    const netRoi = totalCost > 0 ? Math.round((netProfit / totalCost) * 1000) / 10 : 0;
    const costPerQtl = Number(totalYieldQuintals) > 0 ? Math.round(totalCost / Number(totalYieldQuintals)) : 0;

    const ledger = await CropPnlModel.create({
      farmerId,
      farmId,
      sowingId: sowingId || undefined,
      cropName,
      varietyName,
      season,
      areaAcres: Number(areaAcres),
      costBreakdown: {
        seedCost: Number(seedCost),
        landPrepCost: Number(landPrepCost),
        fertilizerNutrientCost: Number(fertilizerNutrientCost),
        cropProtectionCost: Number(cropProtectionCost),
        irrigationCost: Number(irrigationCost),
        laborCost: Number(laborCost),
        harvestingCost: Number(harvestingCost),
        logisticsCost: Number(logisticsCost),
      },
      totalCostOfCultivationInr: totalCost,
      grossMandiRevenueInr: grossRev,
      netProfitInr: netProfit,
      netRoiPercent: netRoi,
      costPerQuintalInr: costPerQtl,
      totalYieldQuintals: Number(totalYieldQuintals),
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'CropPnl',
        entityId: String(ledger._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (ledger.toObject ? ledger.toObject() : ledger) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(ledger);
  } catch (error) {
    return ApiResponse.serverError('Failed to record cultivation P&L ledger', error);
  }
}
