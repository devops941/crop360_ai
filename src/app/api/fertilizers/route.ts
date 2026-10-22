import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { FertilizerItem } from '@/models/fertilizer-catalog.model';
import { getAuthenticatedUser } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return ApiResponse.unauthorized('Authentication required to view fertilizer catalog');
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {
      userId: session.userId,
      isActive: true,
    };

    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { npkRatio: { $regex: search, $options: 'i' } },
      ];
    }

    const fertilizers = await FertilizerItem.find(query)
      .sort({ category: 1, name: 1 })
      .lean();

    return ApiResponse.success(fertilizers);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch fertilizer catalog', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return ApiResponse.unauthorized('Authentication required to add fertilizer items');
    }

    const body = await request.json();

    const {
      name,
      category = 'primary_npk',
      npkRatio = '',
      manufacturer,
      bagSizeKg = 50,
      unit = 'bag',
      pricePerUnitInr,
      subsidizedPriceInr,
      stockAvailableUnits = 50,
      suitableCrops = [],
      applicationMethod = 'broadcasting',
      dosageGuide = '',
      batchNumber = '',
    } = body;

    if (!name || !manufacturer || !pricePerUnitInr) {
      return ApiResponse.badRequest('Fertilizer name, manufacturer, and price are required.');
    }

    const existing = await FertilizerItem.findOne({
      userId: session.userId,
      name: name.trim(),
    });
    if (existing) {
      return ApiResponse.badRequest('A fertilizer entry with this name already exists in your catalog');
    }

    const newFertilizer = await FertilizerItem.create({
      userId: session.userId,
      name: name.trim(),
      category,
      npkRatio: npkRatio.trim(),
      manufacturer: manufacturer.trim(),
      bagSizeKg: Number(bagSizeKg) || 50,
      unit,
      pricePerUnitInr: Number(pricePerUnitInr),
      subsidizedPriceInr: subsidizedPriceInr ? Number(subsidizedPriceInr) : undefined,
      stockAvailableUnits: Number(stockAvailableUnits) || 0,
      suitableCrops: Array.isArray(suitableCrops)
        ? suitableCrops
        : String(suitableCrops)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      applicationMethod,
      dosageGuide: dosageGuide.trim(),
      batchNumber: batchNumber.trim() || `FT-${Date.now().toString().slice(-6)}`,
      isActive: true,
    });

    return ApiResponse.created(newFertilizer, 'Fertilizer entry created in your catalog successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to create fertilizer entry', error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const session = await getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return ApiResponse.unauthorized('Authentication required to update fertilizer items');
    }

    const body = await request.json();
    const { _id, id, ...updateFields } = body;
    const targetId = _id || id;

    if (!targetId) {
      return ApiResponse.badRequest('Fertilizer ID is required for update');
    }

    if (typeof updateFields.suitableCrops === 'string') {
      updateFields.suitableCrops = updateFields.suitableCrops
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    if (updateFields.pricePerUnitInr !== undefined) {
      updateFields.pricePerUnitInr = Number(updateFields.pricePerUnitInr);
    }
    if (updateFields.stockAvailableUnits !== undefined) {
      updateFields.stockAvailableUnits = Number(updateFields.stockAvailableUnits);
    }
    if (updateFields.bagSizeKg !== undefined) {
      updateFields.bagSizeKg = Number(updateFields.bagSizeKg);
    }

    // Ensure the fertilizer item belongs to the authenticated user
    const updated = await FertilizerItem.findOneAndUpdate(
      { _id: targetId, userId: session.userId },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return ApiResponse.notFound('Fertilizer item not found or you do not have permission to modify it');
    }

    return ApiResponse.success(updated, 'Fertilizer entry updated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to update fertilizer entry', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return ApiResponse.unauthorized('Authentication required to delete fertilizer items');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Fertilizer ID is required for deletion');
    }

    // Ensure only the user's own fertilizer can be deleted
    const deleted = await FertilizerItem.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });

    if (!deleted) {
      return ApiResponse.notFound('Fertilizer item not found or you do not have permission to delete it');
    }

    return ApiResponse.success({ id }, 'Fertilizer item removed successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to delete fertilizer item', error);
  }
}
