import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { TradeOrderModel } from '@/models/trade-order.model';
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
    if (status) filter.orderStatus = status;

    const orders = await TradeOrderModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('inventoryId', 'lotNumber storageLocationName bagsStored')
      .sort({ contractDate: -1 })
      .lean();

    return ApiResponse.success(orders);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch buyer trade orders', error);
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
      inventoryId,
      commodity,
      variety,
      buyerName,
      buyerType = 'wholesaler',
      buyerContactPhone,
      agreedPricePerQuintalInr,
      quantityQuintals,
      paymentStatus = 'advance_paid',
      orderStatus = 'confirmed',
      notes,
    } = body;

    if (!farmerId || !farmId || !commodity || !buyerName || !buyerContactPhone || !agreedPricePerQuintalInr || !quantityQuintals) {
      return ApiResponse.badRequest(
        'farmerId, farmId, commodity, buyerName, buyerContactPhone, agreedPrice, and quantity are required'
      );
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(farmerId))) {
      return ApiResponse.forbidden('You do not have permission to create trade contracts for this farmer');
    }

    const totalAmt = Number(agreedPricePerQuintalInr) * Number(quantityQuintals);
    const invNum = `INV-TN-${Date.now().toString().slice(-6)}`;

    const order = await TradeOrderModel.create({
      farmerId,
      farmId,
      inventoryId: inventoryId || undefined,
      commodity,
      variety: variety || 'Standard Quality',
      buyerName,
      buyerType,
      buyerContactPhone,
      agreedPricePerQuintalInr: Number(agreedPricePerQuintalInr),
      quantityQuintals: Number(quantityQuintals),
      totalSaleAmountInr: totalAmt,
      paymentStatus,
      orderStatus,
      contractDate: new Date(),
      invoiceNumber: invNum,
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'TradeOrder',
        entityId: String(order._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (order.toObject ? order.toObject() : order) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(order);
  } catch (error) {
    return ApiResponse.serverError('Failed to create buyer trade contract', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const body = await request.json();
    const { id, orderStatus, paymentStatus } = body;

    if (!id || !orderStatus) {
      return ApiResponse.badRequest('id and orderStatus are required');
    }

    const order = await TradeOrderModel.findById(id);
    if (!order) {
      return ApiResponse.notFound('Trade order not found');
    }

    if (!scope.isAdmin && !scope.farmerIdStrings.includes(String(order.farmerId))) {
      return ApiResponse.forbidden('You do not have permission to update this trade contract');
    }

    const update: Record<string, unknown> = { orderStatus };
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const updated = await TradeOrderModel.findByIdAndUpdate(id, update, { new: true });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'TradeOrder',
        entityId: id,
        action: 'UPDATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: { orderStatus, paymentStatus },
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.success(updated);
  } catch (error) {
    return ApiResponse.serverError('Failed to update trade contract status', error);
  }
}
