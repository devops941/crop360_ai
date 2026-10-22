import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { LifecyclePlanModel } from '@/models/lifecycle-plan.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { getTenantScope } from '@/lib/tenant';

import { SowingRecordModel } from '@/models/sowing.model';

export const dynamic = 'force-dynamic';

function generateDefaultPhases(durationDays: number) {
  const p1End = Math.round(durationDays * 0.15);
  const p2End = Math.round(durationDays * 0.45);
  const p3End = Math.round(durationDays * 0.70);
  const p4End = Math.round(durationDays * 0.90);

  return [
    {
      phaseName: 'Nursery & Land Preparation',
      startDay: 1,
      endDay: p1End,
      criticalMilestones: ['Chisel plowing & basal compost incorporation', 'Seed bio-inoculation & nursery seedling emergence', 'Transplanting / main field sowing'],
      estimatedBudgetSharePercent: 25,
    },
    {
      phaseName: 'Vegetative & Active Tillering',
      startDay: p1End + 1,
      endDay: p2End,
      criticalMilestones: ['First top-dress urea & micronutrient application', 'Cono-weeder intercultural aeration', 'Moisture depletion monitoring & ETc irrigation'],
      estimatedBudgetSharePercent: 30,
    },
    {
      phaseName: 'Panicle Initiation & Booting',
      startDay: p2End + 1,
      endDay: p3End,
      criticalMilestones: ['Flag leaf emergence & panicle division', 'Second split potassium / DAP top dressing', 'Prophylactic neem bio-spray against stem borers'],
      estimatedBudgetSharePercent: 20,
    },
    {
      phaseName: 'Flowering & Grain Filling',
      startDay: p3End + 1,
      endDay: p4End,
      criticalMilestones: ['Uniform 50% flowering & milk stage filling', 'Maintain 2-3 cm standing water film', 'Check Pre-Harvest Interval (PHI) compliance'],
      estimatedBudgetSharePercent: 15,
    },
    {
      phaseName: 'Physiological Maturity & Harvest',
      startDay: p4End + 1,
      endDay: durationDays,
      criticalMilestones: ['Field drainage 10 days before harvest', '85% golden husk discoloration', 'Combine harvester threshing at 18-20% grain moisture'],
      estimatedBudgetSharePercent: 10,
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
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
    if (status) filter.status = status;

    let plans = await LifecyclePlanModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('sowingId', 'sowingDate cropName varietyName')
      .sort({ createdAt: -1 })
      .lean();

    // Auto-generate plan from active sowing if empty for this parcel
    if (plans.length === 0 && (farmId || farmerId)) {
      const sowFilter: Record<string, unknown> = {};
      if (farmId) sowFilter.farmId = farmId;
      if (farmerId) sowFilter.farmerId = farmerId;
      if (!scope.isAdmin) sowFilter.farmerId = { $in: scope.farmerIds };

      const activeSowing = await SowingRecordModel.findOne(sowFilter).sort({ sowingDate: -1 }).lean();
      if (activeSowing) {
        const sowDate = new Date(activeSowing.sowingDate || Date.now());
        const duration = 115;
        const targetHarvest = new Date(sowDate.getTime() + duration * 24 * 60 * 60 * 1000);
        const phases = generateDefaultPhases(duration);

        const created = await LifecyclePlanModel.create({
          farmerId: activeSowing.farmerId,
          farmId: activeSowing.farmId,
          sowingId: activeSowing._id,
          cropName: activeSowing.cropName,
          varietyName: activeSowing.varietyName,
          sowingDate: sowDate,
          targetHarvestDate: targetHarvest,
          totalDurationDays: duration,
          phases,
          riskFactors: ['Late monsoon withdrawal risk', 'Lodging vulnerability under heavy nitrogen top-dressing'],
          status: 'active',
          notes: 'Auto-calibrated ICAR crop lifecycle baseline generated from active sowing record.',
        });

        const populated = await LifecyclePlanModel.findById(created._id)
          .populate('farmerId', 'name farmerCode phone district')
          .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
          .populate('sowingId', 'sowingDate cropName varietyName')
          .lean();
        if (populated) plans = [populated as any];
      }
    }

    return ApiResponse.success(plans);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch crop lifecycle plans', error);
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
      sowingDate,
      totalDurationDays = 120,
      phases,
      riskFactors,
      status = 'active',
      notes,
    } = body;

    if (!farmerId || !farmId || !cropName || !varietyName) {
      return ApiResponse.badRequest('farmerId, farmId, cropName, and varietyName are required');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to create lifecycle plans for this farmer');
    }

    const sDate = sowingDate ? new Date(sowingDate) : new Date();
    const tHarvest = new Date(sDate);
    tHarvest.setDate(sDate.getDate() + Number(totalDurationDays));

    const planPhases = phases && phases.length > 0 ? phases : generateDefaultPhases(Number(totalDurationDays));

    const plan = await LifecyclePlanModel.create({
      farmerId,
      farmId,
      sowingId: sowingId || undefined,
      cropName,
      varietyName,
      sowingDate: sDate,
      targetHarvestDate: tHarvest,
      totalDurationDays: Number(totalDurationDays),
      phases: planPhases,
      riskFactors: riskFactors || [
        'Late season rainfall during ripening stage',
        'Stem borer attack during panicle elongation',
        'Mid-season water stress if canal supply fluctuates',
      ],
      status,
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'LifecyclePlan',
        entityId: String(plan._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (plan.toObject ? plan.toObject() : plan) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(plan);
  } catch (error) {
    return ApiResponse.serverError('Failed to create crop lifecycle plan', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return ApiResponse.badRequest('id and status are required');
    }

    const updated = await LifecyclePlanModel.findByIdAndUpdate(
      id,
      { status, ...(notes !== undefined && { notes }) },
      { new: true }
    );

    if (!updated) {
      return ApiResponse.notFound('Lifecycle plan not found');
    }

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'LifecyclePlan',
        entityId: id,
        action: 'UPDATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: { status, notes },
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.success(updated);
  } catch (error) {
    return ApiResponse.serverError('Failed to update lifecycle plan', error);
  }
}
