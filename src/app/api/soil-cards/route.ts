import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SoilHealthCard } from '@/models/soil-health-card.model';
import { SoilReport } from '@/models/soil-report.model';
import { SoilCardService } from '@/services/soil-card.service';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { getTenantScope } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const scope = await getTenantScope(request);
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');

    const filter: Record<string, unknown> = {};
    if (!scope.isAdmin) {
      if (farmerId) {
        if (scope.farmerIdStrings.includes(String(farmerId))) {
          filter.farmerId = farmerId;
        } else {
          return ApiResponse.success([]);
        }
      } else {
        filter.farmerId = { $in: scope.farmerIds };
      }
    } else if (farmerId) {
      filter.farmerId = farmerId;
    }

    // Auto-generate cards for any existing soil reports that do not have a card yet
    try {
      const reportsQuery = { ...filter };
      const unissuedReports = await SoilReport.find(reportsQuery);
      for (const rep of unissuedReports) {
        const cardExists = await SoilHealthCard.exists({ reportId: rep._id });
        if (!cardExists) {
          await SoilCardService.issueCardForReport(String(rep._id));
        }
      }
    } catch (autoErr) {
      console.warn('Auto card issuance notice:', autoErr);
    }

    const cards = await SoilHealthCard.find(filter)
      .populate('farmerId', 'name farmerCode phone district state')
      .populate('farmId', 'parcelName surveyNumber totalAreaAcres soilType')
      .populate('reportId', 'sampleCode testDate')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(cards);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch Soil Health Cards', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { reportId } = body;

    if (!reportId) {
      return ApiResponse.badRequest('reportId is required to generate a Soil Health Card');
    }

    const card = await SoilCardService.issueCardForReport(reportId);

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    await AuditLogger.record({
      entityType: 'SoilHealthCard',
      entityId: String(card._id),
      action: 'CREATE',
      performedBy: {
        userId: session?.userId,
        userName: session?.name || 'System',
        userRole: session?.role || 'operator',
      },
      after: (card.toObject ? card.toObject() : card) as unknown as Record<string, unknown>,
    });

    return ApiResponse.created(card, 'Official Soil Health Card generated successfully');
  } catch (error) {
    return ApiResponse.serverError('Failed to generate Soil Health Card', error);
  }
}
