import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { LandPreparationPlan } from '@/models/land-prep.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    const plan = await LandPreparationPlan.findById(id);

    if (!plan) {
      return ApiResponse.notFound('Land preparation plan not found');
    }

    const body = await request.json();
    const { stepNumber, isCompleted } = body;

    const op = plan.operations.find((o) => o.stepNumber === stepNumber);
    if (op) {
      op.isCompleted = isCompleted;
      op.completedDate = isCompleted ? new Date() : undefined;
    }

    // Recalculate readiness score
    const completedCount = plan.operations.filter((o) => o.isCompleted).length;
    plan.readinessScorePercent = Math.round((completedCount / plan.operations.length) * 100);

    if (plan.readinessScorePercent === 100) {
      plan.status = 'seedbed_ready';
    } else if (plan.readinessScorePercent > 0) {
      plan.status = 'in_progress';
    } else {
      plan.status = 'planning';
    }

    await plan.save();

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'LandPreparationPlan',
      entityId: id,
      action: 'UPDATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: {
        stepNumber,
        isCompleted,
        readinessScorePercent: plan.readinessScorePercent,
        status: plan.status,
      },
    });

    return ApiResponse.success(plan, 'Tillage step updated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to update tillage step', error);
  }
}
