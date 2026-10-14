import { NextRequest, NextResponse } from 'next/server';
import { AlertNotificationRepository } from '@/repositories/alert-notification.repository';
import { AuditLogger } from '@/lib/audit-logger';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId') || undefined;
    const category = searchParams.get('category') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const filter: Record<string, unknown> = {};
    if (farmerId) filter.farmerId = farmerId;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (unreadOnly) filter.isRead = false;

    const alerts = await AlertNotificationRepository.getAll(filter);
    return NextResponse.json({ success: true, count: alerts.length, data: alerts });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const authUser = token ? await verifyAuthToken(token) : null;
    const body = await request.json();

    const newAlert = await AlertNotificationRepository.create({
      farmerId: body.farmerId || authUser?.userId || 'FARMER_DEFAULT',
      farmId: body.farmId,
      category: body.category || 'SYSTEM',
      severity: body.severity || 'INFO',
      title: body.title,
      message: body.message,
      messageVernacular: body.messageVernacular,
      channels: body.channels || ['IN_APP'],
      deliveryStatus: {
        inApp: 'DELIVERED',
        sms: body.channels?.includes('SMS') ? 'SENT' : undefined,
        whatsapp: body.channels?.includes('WHATSAPP') ? 'SENT' : undefined,
      },
      actionUrl: body.actionUrl,
    });

    await AuditLogger.record({
      entityType: 'ALERT_NOTIFICATION',
      entityId: String(newAlert._id),
      action: 'CREATE',
      performedBy: {
        userId: authUser?.userId,
        userName: authUser?.name || 'Automated Sentinel',
        userRole: authUser?.role || 'SYSTEM',
      },
      after: newAlert.toObject() as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, data: newAlert }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.markAll && body.farmerId) {
      await AlertNotificationRepository.markAllAsRead(body.farmerId);
      return NextResponse.json({ success: true, message: 'All alerts marked as read' });
    }

    if (body.alertId) {
      const updated = await AlertNotificationRepository.markAsRead(body.alertId);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
