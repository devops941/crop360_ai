import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { MarketPriceModel } from '@/models/market-price.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

const DEFAULT_MANDI_RATES = [
  {
    commodity: 'Paddy / Rice',
    variety: 'Common / Grade A',
    mandiName: 'Thanjavur APMC Regulated Market',
    district: 'Thanjavur',
    state: 'Tamil Nadu',
    minPriceInrPerQuintal: 2280,
    modalPriceInrPerQuintal: 2360,
    maxPriceInrPerQuintal: 2450,
    governmentMspInrPerQuintal: 2320,
    priceTrend: 'upward',
  },
  {
    commodity: 'Paddy / Rice',
    variety: 'BPT 5204 (Fine)',
    mandiName: 'Madurai Central Mandi',
    district: 'Madurai',
    state: 'Tamil Nadu',
    minPriceInrPerQuintal: 2550,
    modalPriceInrPerQuintal: 2680,
    maxPriceInrPerQuintal: 2790,
    governmentMspInrPerQuintal: 2320,
    priceTrend: 'upward',
  },
  {
    commodity: 'Maize / Corn',
    variety: 'Yellow Hybrid',
    mandiName: 'Udumalpet Regulated Market',
    district: 'Tirupur',
    state: 'Tamil Nadu',
    minPriceInrPerQuintal: 2150,
    modalPriceInrPerQuintal: 2240,
    maxPriceInrPerQuintal: 2320,
    governmentMspInrPerQuintal: 2225,
    priceTrend: 'stable',
  },
  {
    commodity: 'Groundnut / Peanut',
    variety: 'Pods (With Shell)',
    mandiName: 'Tindivanam Regulated Market',
    district: 'Villupuram',
    state: 'Tamil Nadu',
    minPriceInrPerQuintal: 6400,
    modalPriceInrPerQuintal: 6850,
    maxPriceInrPerQuintal: 7200,
    governmentMspInrPerQuintal: 6783,
    priceTrend: 'upward',
  },
  {
    commodity: 'Cotton',
    variety: 'Medium Staple (Bt Cotton)',
    mandiName: 'Konganapuram APMC',
    district: 'Salem',
    state: 'Tamil Nadu',
    minPriceInrPerQuintal: 6900,
    modalPriceInrPerQuintal: 7350,
    maxPriceInrPerQuintal: 7600,
    governmentMspInrPerQuintal: 7121,
    priceTrend: 'stable',
  },
  {
    commodity: 'Black Gram / Urad Dal',
    variety: 'Whole Grain',
    mandiName: 'Tiruchirappalli APMC',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    minPriceInrPerQuintal: 7100,
    modalPriceInrPerQuintal: 7550,
    maxPriceInrPerQuintal: 7900,
    governmentMspInrPerQuintal: 7400,
    priceTrend: 'upward',
  },
];

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get('commodity');
    const district = searchParams.get('district');

    const filter: Record<string, unknown> = {};
    if (commodity && commodity !== 'all') {
      filter.commodity = new RegExp(commodity, 'i');
    }
    if (district && district !== 'all') {
      filter.district = new RegExp(district, 'i');
    }

    let prices = await MarketPriceModel.find(filter).sort({ recordedDate: -1 }).lean();

    if (prices.length === 0) {
      // Auto seed default data
      await MarketPriceModel.insertMany(
        DEFAULT_MANDI_RATES.map((r) => ({ ...r, recordedDate: new Date() }))
      );
      prices = await MarketPriceModel.find(filter).sort({ recordedDate: -1 }).lean();
    }

    return ApiResponse.success(prices);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch mandi market prices', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      commodity,
      variety,
      mandiName,
      district,
      state = 'Tamil Nadu',
      minPriceInrPerQuintal,
      modalPriceInrPerQuintal,
      maxPriceInrPerQuintal,
      governmentMspInrPerQuintal,
      priceTrend = 'stable',
    } = body;

    if (!commodity || !variety || !mandiName || !district || modalPriceInrPerQuintal === undefined) {
      return ApiResponse.badRequest(
        'commodity, variety, mandiName, district, and modalPriceInrPerQuintal are required'
      );
    }

    const price = await MarketPriceModel.create({
      commodity,
      variety,
      mandiName,
      district,
      state,
      minPriceInrPerQuintal: Number(minPriceInrPerQuintal) || Number(modalPriceInrPerQuintal) * 0.95,
      modalPriceInrPerQuintal: Number(modalPriceInrPerQuintal),
      maxPriceInrPerQuintal: Number(maxPriceInrPerQuintal) || Number(modalPriceInrPerQuintal) * 1.05,
      governmentMspInrPerQuintal: Number(governmentMspInrPerQuintal) || 2320,
      priceTrend,
      recordedDate: new Date(),
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'MarketPrice',
        entityId: String(price._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: (price.toObject ? price.toObject() : price) as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(price);
  } catch (error) {
    return ApiResponse.serverError('Failed to record market price entry', error);
  }
}
