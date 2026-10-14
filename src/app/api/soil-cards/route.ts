import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { SoilHealthCard } from '@/models/soil-health-card.model';
import { SoilReport } from '@/models/soil-report.model';
import { SoilAnalysisResult } from '@/models/soil-analysis.model';
import { Farmer } from '@/models/farmer.model';
import { Farm } from '@/models/farm.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');

    const filter: Record<string, unknown> = {};
    if (farmerId) filter.farmerId = farmerId;

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

    const report = await SoilReport.findById(reportId);
    if (!report) {
      return ApiResponse.notFound('Soil test report not found');
    }

    const analysis = await SoilAnalysisResult.findOne({ reportId });
    if (!analysis) {
      return ApiResponse.badRequest('Soil test report must be analyzed before generating Health Card');
    }

    const farmer = await Farmer.findById(report.farmerId);
    const farm = await Farm.findById(report.farmId);

    if (!farmer || !farm) {
      return ApiResponse.badRequest('Associated Farmer or Farm record missing');
    }

    // Auto-generate Card Number
    const year = new Date().getFullYear();
    const prefix = `SHC-CRD-${year}-`;
    const latest = await SoilHealthCard.findOne({ cardNumber: { $regex: `^${prefix}` } })
      .sort({ cardNumber: -1 })
      .lean();

    let nextNum = 1;
    if (latest && latest.cardNumber) {
      const parsed = parseInt(latest.cardNumber.replace(prefix, ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    const cardNumber = `${prefix}${nextNum.toString().padStart(4, '0')}`;

    const issuedDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const verificationCode = `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const card = await SoilHealthCard.create({
      cardNumber,
      reportId: report._id,
      farmerId: farmer._id,
      farmId: farm._id,
      issuedDate,
      expiryDate,
      qrVerificationCode: verificationCode,
      cycle: `Cycle ${year}-${year + 3}`,
      cardDataSnapshot: {
        farmerName: farmer.name,
        farmerCode: farmer.farmerCode,
        phone: farmer.phone,
        district: farmer.district,
        state: farmer.state,
        parcelName: farm.parcelName,
        surveyNumber: farm.surveyNumber,
        totalAreaAcres: farm.totalAreaAcres,
        soilType: farm.soilType,
        overallHealthScore: analysis.overallHealthScore,
        fertilityRating: analysis.fertilityRating,
        phValue: report.parameters.pH,
        ecValue: report.parameters.electricalConductivity,
        ocValue: report.parameters.organicCarbon,
        nitrogenValue: report.parameters.nitrogen,
        phosphorusValue: report.parameters.phosphorus,
        potassiumValue: report.parameters.potassium,
        topRecommendations: analysis.actionPlan.slice(0, 3).map((a) => `${a.action}: ${a.dosagePerAcre}`),
      },
      status: 'active',
    });

    report.status = 'card_generated';
    await report.save();

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
