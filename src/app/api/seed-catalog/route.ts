import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SeedCatalogItem } from '@/models/seed-catalog.model';
import { getAuthenticatedUser } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return ApiResponse.unauthorized('Authentication required to view seed catalog');
    }

    const { searchParams } = new URL(request.url);
    const cropName = searchParams.get('cropName');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {
      userId: session.userId,
      isActive: true,
    };

    if (cropName) {
      query.cropName = { $regex: cropName, $options: 'i' };
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { cropName: { $regex: search, $options: 'i' } },
        { varietyName: { $regex: search, $options: 'i' } },
        { sourceBreeder: { $regex: search, $options: 'i' } },
      ];
    }

    const seeds = await SeedCatalogItem.find(query).sort({ cropName: 1, varietyName: 1 }).lean();

    return ApiResponse.success(seeds);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch seed catalog', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return ApiResponse.unauthorized('Authentication required to add seed varieties');
    }

    const body = await request.json();

    const {
      cropName,
      varietyName,
      category = 'cereal',
      sourceBreeder,
      seedCategory = 'certified',
      germinationRatePercent = 85,
      seedRatePerAcreKg,
      seedRateKgNumber,
      costPerKgInr,
      stockAvailableKg = 120,
      durationDays,
      pestResistanceTraits = [],
      seedTreatmentAdvisory = {},
    } = body;

    if (!cropName || !varietyName || !sourceBreeder || !seedRatePerAcreKg || !costPerKgInr) {
      return ApiResponse.badRequest('Required seed catalog fields missing');
    }

    const existing = await SeedCatalogItem.findOne({
      userId: session.userId,
      varietyName: varietyName.trim(),
    });
    if (existing) {
      return ApiResponse.badRequest('A seed variety with this name already exists in your catalog');
    }

    const newSeed = await SeedCatalogItem.create({
      userId: session.userId,
      cropName: cropName.trim(),
      varietyName: varietyName.trim(),
      category,
      sourceBreeder: sourceBreeder.trim(),
      seedCategory,
      germinationRatePercent: Number(germinationRatePercent) || 85,
      seedRatePerAcreKg: seedRatePerAcreKg.trim(),
      seedRateKgNumber: Number(seedRateKgNumber) || parseFloat(seedRatePerAcreKg) || 10,
      costPerKgInr: Number(costPerKgInr),
      stockAvailableKg: Number(stockAvailableKg) || 120,
      durationDays: durationDays || '100 - 120 days',
      pestResistanceTraits: Array.isArray(pestResistanceTraits)
        ? pestResistanceTraits
        : String(pestResistanceTraits)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      seedTreatmentAdvisory: {
        fungicideTreatment: seedTreatmentAdvisory.fungicideTreatment || '',
        biofertilizerInoculation: seedTreatmentAdvisory.biofertilizerInoculation || '',
        soakingDurationHours: Number(seedTreatmentAdvisory.soakingDurationHours) || 0,
      },
      isActive: true,
    });

    return ApiResponse.created(newSeed, 'Seed variety registered into your catalog successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to register seed variety', error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const session = await getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return ApiResponse.unauthorized('Authentication required to update seed varieties');
    }

    const body = await request.json();
    const { _id, id, ...updateFields } = body;
    const targetId = _id || id;

    if (!targetId) {
      return ApiResponse.badRequest('Seed ID is required for update');
    }

    if (updateFields.seedRatePerAcreKg && !updateFields.seedRateKgNumber) {
      updateFields.seedRateKgNumber = parseFloat(updateFields.seedRatePerAcreKg) || 10;
    }

    if (typeof updateFields.pestResistanceTraits === 'string') {
      updateFields.pestResistanceTraits = updateFields.pestResistanceTraits
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    // Ensure the seed belongs to the authenticated user
    const updated = await SeedCatalogItem.findOneAndUpdate(
      { _id: targetId, userId: session.userId },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return ApiResponse.notFound('Seed variety not found or you do not have permission to modify it');
    }

    return ApiResponse.success(updated, 'Seed variety updated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to update seed variety', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return ApiResponse.unauthorized('Authentication required to delete seed varieties');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Seed ID is required for deletion');
    }

    // Ensure only the user's own seed can be deleted
    const deleted = await SeedCatalogItem.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });

    if (!deleted) {
      return ApiResponse.notFound('Seed variety not found or you do not have permission to delete it');
    }

    return ApiResponse.success({ id }, 'Seed variety deleted successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to delete seed variety', error);
  }
}
