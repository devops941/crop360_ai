import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { CropTaskModel } from '@/models/crop-task.model';
import { SowingRecordModel } from '@/models/sowing.model';
import { LifecyclePlanModel } from '@/models/lifecycle-plan.model';
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
    const planId = searchParams.get('planId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

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
    if (planId) filter.planId = planId;
    if (status) filter.status = status;
    if (category) filter.taskCategory = category;

    let tasks = await CropTaskModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('planId', 'cropName varietyName targetHarvestDate')
      .sort({ scheduledDate: 1 })
      .lean();

    // Auto-generate standard crop task milestones if none exist for this parcel
    if (tasks.length === 0 && (farmId || farmerId)) {
      const sowFilter: Record<string, unknown> = {};
      if (farmId) sowFilter.farmId = farmId;
      if (farmerId) sowFilter.farmerId = farmerId;
      if (!scope.isAdmin) sowFilter.farmerId = { $in: scope.farmerIds };

      const activeSow = await SowingRecordModel.findOne(sowFilter).sort({ sowingDate: -1 }).lean();
      if (activeSow) {
        const sowTime = new Date(activeSow.sowingDate || Date.now()).getTime();
        const activePlan = await LifecyclePlanModel.findOne({ farmId: activeSow.farmId }).lean();

        const defaultTasks = [
          {
            farmerId: activeSow.farmerId,
            farmId: activeSow.farmId,
            planId: activePlan?._id || undefined,
            taskTitle: 'Rotavator Tillage & Basal Compost Incorporation',
            taskCategory: 'land_prep',
            scheduledDate: new Date(sowTime - 2 * 24 * 60 * 60 * 1000),
            assignedLaborCount: 2,
            estimatedLaborCostInr: 1200,
            status: 'done',
            priority: 'high',
            completedDate: new Date(sowTime - 1 * 24 * 60 * 60 * 1000),
            notes: 'Field leveling and incorporation of 5 tonnes farmyard manure completed.',
          },
          {
            farmerId: activeSow.farmerId,
            farmId: activeSow.farmId,
            planId: activePlan?._id || undefined,
            taskTitle: 'Cono-Weeder Intercultural Soil Aeration',
            taskCategory: 'weeding',
            scheduledDate: new Date(sowTime + 20 * 24 * 60 * 60 * 1000),
            assignedLaborCount: 3,
            estimatedLaborCostInr: 1350,
            status: 'in_progress',
            priority: 'medium',
            notes: 'Inter-row rotary weeding to aerate root zone and bury green weeds.',
          },
          {
            farmerId: activeSow.farmerId,
            farmId: activeSow.farmId,
            planId: activePlan?._id || undefined,
            taskTitle: 'Second Split Urea & Potash Top Dressing',
            taskCategory: 'fertilization',
            scheduledDate: new Date(sowTime + 42 * 24 * 60 * 60 * 1000),
            assignedLaborCount: 2,
            estimatedLaborCostInr: 800,
            status: 'todo',
            priority: 'high',
            notes: 'Apply 30kg Urea + 15kg MOP during panicle initiation milestone.',
          },
          {
            farmerId: activeSow.farmerId,
            farmId: activeSow.farmId,
            planId: activePlan?._id || undefined,
            taskTitle: 'Prophylactic Neem Bio-Pesticide Knapsack Spray',
            taskCategory: 'spraying',
            scheduledDate: new Date(sowTime + 55 * 24 * 60 * 60 * 1000),
            assignedLaborCount: 2,
            estimatedLaborCostInr: 900,
            status: 'todo',
            priority: 'urgent',
            notes: 'Target stem borer and leaf folder prevention across canopy.',
          },
          {
            farmerId: activeSow.farmerId,
            farmId: activeSow.farmId,
            planId: activePlan?._id || undefined,
            taskTitle: 'Combine Harvester Mechanical Threshing Run',
            taskCategory: 'harvest',
            scheduledDate: new Date(sowTime + 105 * 24 * 60 * 60 * 1000),
            assignedLaborCount: 4,
            estimatedLaborCostInr: 3800,
            status: 'todo',
            priority: 'urgent',
            notes: 'Coordinate track combine harvester at 18-20% grain moisture window.',
          },
        ];

        await CropTaskModel.insertMany(defaultTasks);

        tasks = await CropTaskModel.find(filter)
          .populate('farmerId', 'name farmerCode phone district')
          .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
          .populate('planId', 'cropName varietyName targetHarvestDate')
          .sort({ scheduledDate: 1 })
          .lean();
      }
    }

    return ApiResponse.success(tasks);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch crop tasks', error);
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
      planId,
      taskTitle,
      taskCategory = 'general',
      scheduledDate,
      assignedLaborCount = 2,
      estimatedLaborCostInr = 800,
      status = 'todo',
      priority = 'medium',
      notes,
    } = body;

    if (!farmerId || !farmId || !taskTitle) {
      return ApiResponse.badRequest('farmerId, farmId, and taskTitle are required');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to assign crop tasks for this farmer');
    }

    const task = await CropTaskModel.create({
      farmerId,
      farmId,
      planId: planId || undefined,
      taskTitle,
      taskCategory,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      assignedLaborCount: Number(assignedLaborCount),
      estimatedLaborCostInr: Number(estimatedLaborCostInr),
      status,
      priority,
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'CropTask',
        entityId: String(task._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (task.toObject ? task.toObject() : task) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(task);
  } catch (error) {
    return ApiResponse.serverError('Failed to schedule crop task', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const body = await request.json();
    const { id, status, completedDate } = body;

    if (!id || !status) {
      return ApiResponse.badRequest('id and status are required');
    }

    const task = await CropTaskModel.findById(id);
    if (!task) {
      return ApiResponse.notFound('Crop task not found');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(task.farmerId))) {
      return ApiResponse.forbidden('You do not have permission to update this crop task');
    }

    const update: Record<string, unknown> = { status };
    if (completedDate || status === 'done') {
      update.completedDate = completedDate ? new Date(completedDate) : new Date();
    }

    const updated = await CropTaskModel.findByIdAndUpdate(id, update, { new: true });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'CropTask',
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
    return ApiResponse.serverError('Failed to update task status', error);
  }
}
