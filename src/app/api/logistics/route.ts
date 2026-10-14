import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { LogisticsModel } from '@/models/logistics.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (farmId) filter.farmId = farmId;
    if (farmerId) filter.farmerId = farmerId;
    if (status) filter.deliveryStatus = status;

    const trips = await LogisticsModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('orderId', 'buyerName commodity agreedPricePerQuintalInr quantityQuintals')
      .sort({ dispatchTimestamp: -1 })
      .lean();

    return ApiResponse.success(trips);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch logistics dispatches', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      farmerId,
      farmId,
      orderId,
      vehicleType = 'mini_truck_ace',
      vehicleRegistrationNo,
      driverName,
      driverPhone,
      pickupLocation,
      destinationMandi,
      distanceKm,
      freightChargeInr,
      dispatchTimestamp,
      deliveryStatus = 'scheduled',
      notes,
    } = body;

    if (!farmerId || !farmId || !vehicleRegistrationNo || !driverName || !driverPhone || !pickupLocation || !destinationMandi) {
      return ApiResponse.badRequest(
        'farmerId, farmId, vehicleRegistrationNo, driverName, driverPhone, pickupLocation, and destinationMandi are required'
      );
    }

    const trip = await LogisticsModel.create({
      farmerId,
      farmId,
      orderId: orderId || undefined,
      vehicleType,
      vehicleRegistrationNo,
      driverName,
      driverPhone,
      pickupLocation,
      destinationMandi,
      distanceKm: Number(distanceKm) || 25,
      freightChargeInr: Number(freightChargeInr) || 1200,
      dispatchTimestamp: dispatchTimestamp ? new Date(dispatchTimestamp) : new Date(),
      deliveryStatus,
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'Logistics',
        entityId: String(trip._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (trip.toObject ? trip.toObject() : trip) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(trip);
  } catch (error) {
    return ApiResponse.serverError('Failed to book logistics freight trip', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, deliveryStatus } = body;

    if (!id || !deliveryStatus) {
      return ApiResponse.badRequest('id and deliveryStatus are required');
    }

    const updated = await LogisticsModel.findByIdAndUpdate(
      id,
      { deliveryStatus },
      { new: true }
    );

    if (!updated) {
      return ApiResponse.notFound('Logistics dispatch record not found');
    }

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'Logistics',
        entityId: id,
        action: 'UPDATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: { deliveryStatus },
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.success(updated);
  } catch (error) {
    return ApiResponse.serverError('Failed to update delivery status', error);
  }
}
