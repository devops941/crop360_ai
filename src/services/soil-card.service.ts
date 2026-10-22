import { SoilHealthCard, ISoilHealthCard } from '@/models/soil-health-card.model';
import { SoilReport, ISoilReport } from '@/models/soil-report.model';
import { SoilAnalysisResult } from '@/models/soil-analysis.model';
import { Farmer } from '@/models/farmer.model';
import { Farm } from '@/models/farm.model';
import { SoilAnalysisService } from './soil-analysis.service';

export class SoilCardService {
  /**
   * Generates or retrieves an official Soil Health Card for a given Soil Report
   */
  public static async issueCardForReport(reportId: string): Promise<ISoilHealthCard> {
    const report = (await SoilReport.findById(reportId)) as ISoilReport | null;
    if (!report) {
      throw new Error(`Soil test report not found: ${reportId}`);
    }

    // Check if card already exists
    const existingCard = await SoilHealthCard.findOne({ reportId: report._id });
    if (existingCard) {
      if (report.status !== 'card_generated') {
        report.status = 'card_generated';
        await report.save();
      }
      return existingCard;
    }

    // Ensure AI Soil Analysis exists; if not, execute it automatically
    let analysis = await SoilAnalysisResult.findOne({ reportId: report._id });
    if (!analysis) {
      analysis = await SoilAnalysisService.executeAnalysis(report);
    }

    const farmer = await Farmer.findById(report.farmerId);
    const farm = await Farm.findById(report.farmId);

    if (!farmer || !farm) {
      throw new Error('Associated Farmer or Land Parcel record missing for this soil test report');
    }

    // Auto-generate official Card Number
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

    return card;
  }
}
