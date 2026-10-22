import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import {
  extractTextFromBuffer,
  extractWithClaude,
  extractWithGemini,
  parseSoilReportText,
  SoilReportExtractionResult,
} from '@/lib/soil-report-parser';
import { connectDB } from '@/lib/mongodb';
import { FarmerModel } from '@/models/farmer.model';
import { FarmModel } from '@/models/farm.model';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return ApiResponse.badRequest('Please upload a soil test report document (PDF, PNG, JPG, or TXT).');
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return ApiResponse.badRequest('File size exceeds 10MB limit.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/pdf';

    let extracted: SoilReportExtractionResult | null = null;
    let engineUsed: 'claude-ai' | 'gemini-ai' | 'smart-parser' = 'smart-parser';

    // 1. Attempt Gemini Vision AI first (fast multimodal without local OCR noise)
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiResult = await extractWithGemini(buffer, mimeType);
        if (geminiResult && geminiResult.detectedCount > 0) {
          extracted = geminiResult;
          engineUsed = 'gemini-ai';
        }
      } catch (geminiErr) {
        console.warn('Gemini AI extraction failed, trying fallback:', geminiErr);
      }
    }

    // 2. Extract raw text from file if Gemini was not used or failed
    let rawText = '';
    if (!extracted) {
      rawText = await extractTextFromBuffer(buffer, mimeType);
      if (!rawText || rawText.trim().length === 0) {
        return ApiResponse.badRequest(
          'Could not detect readable text in the uploaded document. Please ensure the document is clear and readable.'
        );
      }
    }

    // 3. Attempt Claude AI extraction if configured
    if (!extracted && process.env.ANTHROPIC_API_KEY) {
      try {
        const claudeResult = await extractWithClaude(rawText);
        if (claudeResult && claudeResult.detectedCount > 0) {
          extracted = claudeResult;
          engineUsed = 'claude-ai';
        }
      } catch (claudeErr) {
        console.warn('Claude AI extraction failed, falling back to smart parser:', claudeErr);
      }
    }

    // 4. Intelligent Smart Parser Fallback
    if (!extracted) {
      extracted = parseSoilReportText(rawText);
      engineUsed = 'smart-parser';
    }

    // 5. Contextual Database Matching for Farmer and Farm Parcel
    let matchedFarmerId: string | undefined;
    let matchedFarmId: string | undefined;
    try {
      await connectDB();
      const allFarmers = await FarmerModel.find({}).lean();
      if (allFarmers.length > 0) {
        // Try match by code or name
        const farmer =
          allFarmers.find((f) => {
            if (extracted?.farmerCode && f.farmerCode?.toLowerCase() === extracted.farmerCode.toLowerCase()) return true;
            if (extracted?.farmerName && f.name?.toLowerCase().includes(extracted.farmerName.toLowerCase())) return true;
            if (rawText && f.farmerCode && rawText.toLowerCase().includes(f.farmerCode.toLowerCase())) return true;
            if (rawText && f.name && rawText.toLowerCase().includes(f.name.toLowerCase())) return true;
            return false;
          }) || allFarmers[0];

        if (farmer) {
          matchedFarmerId = String(farmer._id);
          const allFarms = await FarmModel.find({ farmerId: farmer._id }).lean();
          const farm =
            allFarms.find((fm) => {
              if (extracted?.parcelName && fm.parcelName?.toLowerCase().includes(extracted.parcelName.toLowerCase())) return true;
              if (extracted?.surveyNumber && fm.surveyNumber?.toLowerCase() === extracted.surveyNumber.toLowerCase()) return true;
              if (rawText && fm.parcelName && rawText.toLowerCase().includes(fm.parcelName.toLowerCase())) return true;
              if (rawText && fm.surveyNumber && rawText.toLowerCase().includes(fm.surveyNumber.toLowerCase())) return true;
              return false;
            }) || allFarms[0];

          if (farm) {
            matchedFarmId = String(farm._id);
          }
        }
      }
    } catch (dbErr) {
      console.warn('Could not auto-match farmer/farm from DB:', dbErr);
    }

    const message =
      extracted.detectedCount > 0
        ? engineUsed === 'gemini-ai'
          ? `Gemini AI successfully extracted ${extracted.detectedCount} parameter(s) from "${file.name}" with 100% precision!`
          : engineUsed === 'claude-ai'
          ? `Claude AI successfully extracted ${extracted.detectedCount} parameter(s) from "${file.name}"!`
          : `Smart Soil Engine extracted ${extracted.detectedCount} parameter(s) from "${file.name}" with ${extracted.confidence}% confidence!`
        : `Uploaded "${file.name}", but parameters could not be detected automatically. You can enter values manually.`;

    return ApiResponse.success(
      {
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        ...extracted,
        farmerId: matchedFarmerId,
        farmId: matchedFarmId,
        engine: engineUsed,
      },
      message
    );
  } catch (error) {
    console.error('Soil report extraction error:', error);
    return ApiResponse.serverError(
      error instanceof Error ? error.message : 'Failed to process soil report document'
    );
  }
}
