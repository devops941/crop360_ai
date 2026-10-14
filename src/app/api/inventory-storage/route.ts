import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { InventoryStorageModel } from '@/models/inventory-storage.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get('farmId');
    const farmerId = searchParams.get('farmerId');
    const status = searchParams.get('status');
    const storageType = searchParams.get('type');

    const filter: Record<string, unknown> = {};
    if (farmId) filter.farmId = farmId;
    if (farmerId) filter.farmerId = farmerId;
    if (status) filter.status = status;
    if (storageType) filter.storageType = storageType;

    const items = await InventoryStorageModel.find(filter)
      .populate('farmerId', 'name farmerCode phone district')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('harvestId', 'cropName varietyName totalHarvestedYieldQuintals')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(items);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch storage inventory records', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      farmerId,
      farmId,
      harvestId,
      commodity,
      variety,
      storageType = 'farm_godown',
      lotNumber,
      storageLocationName,
      bagsStored,
      bagWeightKg = 50,
      totalQuantityQuintals,
      fumigationLastDate,
      nextFumigationDueDate,
      warehouseReceiptNumber,
      status = 'in_storage',
      notes,
    } = body;

    if (!farmerId || !farmId || !commodity || !variety || !storageLocationName || !bagsStored) {
      return ApiResponse.badRequest(
        'farmerId, farmId, commodity, variety, storageLocationName, and bagsStored are required'
      );
    }

    const autoLot = lotNumber || `LOT-${commodity.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const calcQtl = totalQuantityQuintals ? Number(totalQuantityQuintals) : (Number(bagsStored) * Number(bagWeightKg)) / 100;

    const record = await InventoryStorageModel.create({
      farmerId,
      farmId,
      harvestId: harvestId || undefined,
      commodity,
      variety,
      storageType,
      lotNumber: autoLot,
      storageLocationName,
      bagsStored: Number(bagsStored),
      bagWeightKg: Number(bagWeightKg),
      totalQuantityQuintals: calcQtl,
      fumigationLastDate: fumigationLastDate ? new Date(fumigationLastDate) : new Date(),
      nextFumigationDueDate: nextFumigationDueDate
        ? new Date(nextFumigationDueDate)
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      warehouseReceiptNumber: warehouseReceiptNumber || `eNWR-${Date.now().toString().slice(-6)}`,
      status,
      notes,
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'InventoryStorage',
        entityId: String(record._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (record.toObject ? record.toObject() : record) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(record);
  } catch (error) {
    return ApiResponse.serverError('Failed to record storage inventory stock', error);
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

    const updated = await InventoryStorageModel.findByIdAndUpdate(
      id,
      { status, ...(notes !== undefined && { notes }) },
      { new: true }
    );

    if (!updated) {
      return ApiResponse.notFound('Inventory storage record not found');
    }

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'InventoryStorage',
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
    return ApiResponse.serverError('Failed to update inventory status', error);
  }
}
