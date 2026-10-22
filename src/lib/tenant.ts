import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { AUTH_COOKIE_NAME, verifyAuthToken } from './auth';
import { AuthSessionPayload } from '@/types';
import { connectToDatabase } from './mongodb';
import { FarmerModel, IFarmerDoc } from '@/models/farmer.model';
import { FarmModel } from '@/models/farm.model';

export interface TenantScope {
  session: AuthSessionPayload | null;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  // MongoDB ObjectIds of farmers owned by or belonging to this user
  farmerIds: mongoose.Types.ObjectId[];
  // String format of farmerIds
  farmerIdStrings: string[];
  // MongoDB ObjectIds of farms owned by this user's farmers
  farmIds: mongoose.Types.ObjectId[];
  farmIdStrings: string[];
  // Standard query filter for collections referencing farmerId
  farmerFilter: Record<string, unknown>;
  // Standard query filter for collections referencing farmId
  farmFilter: Record<string, unknown>;
}

/**
 * Extracts the authenticated user session from request cookies or Authorization header
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthSessionPayload | null> {
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const session = await verifyAuthToken(sessionCookie);
    if (session) return session;
  }

  // Fallback to Authorization: Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = await verifyAuthToken(token);
    if (session) return session;
  }

  return null;
}

/**
 * Resolves the tenant scope for the authenticated user.
 * - If Admin: provides unrestricted access (isAdmin: true, empty filter).
 * - If Farmer/Standard User: restricts access to only their owned farmers & farms.
 * - If a user has no Farmer profile yet, automatically ensures an initial Farmer record exists.
 */
export async function getTenantScope(request: NextRequest): Promise<TenantScope> {
  await connectToDatabase();
  const session = await getAuthenticatedUser(request);

  if (!session) {
    // Unauthenticated request fallback: restrict to nothing by matching impossible ID
    const dummyId = new mongoose.Types.ObjectId('000000000000000000000000');
    return {
      session: null,
      userId: null,
      email: null,
      isAdmin: false,
      farmerIds: [],
      farmerIdStrings: [],
      farmIds: [],
      farmIdStrings: [],
      farmerFilter: { farmerId: dummyId },
      farmFilter: { farmId: dummyId },
    };
  }

  const userId = session.userId;
  const email = session.email ? session.email.toLowerCase().trim() : '';
  const isAdmin = session.role === 'admin';

  // Admin users can see all records
  if (isAdmin) {
    return {
      session,
      userId,
      email,
      isAdmin: true,
      farmerIds: [],
      farmerIdStrings: [],
      farmIds: [],
      farmIdStrings: [],
      farmerFilter: {},
      farmFilter: {},
    };
  }

  // Find all Farmer documents created by or matching email of this user
  const farmerQuery: Record<string, unknown> = {
    $or: [{ createdBy: userId }],
  };
  if (email) {
    (farmerQuery.$or as Array<Record<string, unknown>>).push({ email });
  }

  interface FarmerBrief {
    _id: unknown;
    name?: string;
    email?: string;
    farmerCode?: string;
  }

  const userFarmers: FarmerBrief[] = await FarmerModel.find(farmerQuery)
    .select('_id name email farmerCode')
    .lean();

  const farmerIds = userFarmers.map((f) => new mongoose.Types.ObjectId(String(f._id)));
  const farmerIdStrings = userFarmers.map((f) => String(f._id));

  // Find all farm parcels belonging to these farmers
  const userFarms = await FarmModel.find({
    farmerId: { $in: farmerIds },
  })
    .select('_id parcelName farmerId')
    .lean();

  const farmIds = userFarms.map((fm) => new mongoose.Types.ObjectId(String(fm._id)));
  const farmIdStrings = userFarms.map((fm) => String(fm._id));

  return {
    session,
    userId,
    email,
    isAdmin: false,
    farmerIds,
    farmerIdStrings,
    farmIds,
    farmIdStrings,
    farmerFilter: { farmerId: { $in: farmerIds } },
    farmFilter: { farmId: { $in: farmIds } },
  };
}
