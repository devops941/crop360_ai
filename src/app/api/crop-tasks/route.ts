import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { CropTaskModel } from '@/models/crop-task.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
    const planId = searchParams.get('planId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const filter: Record<string, unknown> = {};
    if (farmId) filter.farmId = farmId;
    if (farmerId) filter.farmerId = farmerId;
    if (planId) filter.planId = planId;
    if (status) filter.status = status;
    if (category) filter.taskCategory = category;

    const tasks = await CropTaskModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('planId', 'cropName varietyName targetHarvestDate')
      .sort({ scheduledDate: 1 })
      .lean();

    return ApiResponse.success(tasks);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch crop tasks', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
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
    const body = await request.json();
    const { id, status, completedDate } = body;

    if (!id || !status) {
      return ApiResponse.badRequest('id and status are required');
    }

    const update: Record<string, unknown> = { status };
    if (completedDate || status === 'done') {
      update.completedDate = completedDate ? new Date(completedDate) : new Date();
    }

    const updated = await CropTaskModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return ApiResponse.notFound('Crop task not found');
    }

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
