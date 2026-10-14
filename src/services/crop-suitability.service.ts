import { INDIAN_CROP_BENCHMARKS } from '@/data/crop-benchmarks';
import { ICropSuitabilityScore } from '@/models/crop-recommendation.model';

export interface EvaluationInput {
  soilType: string;
  irrigationSource: string;
  waterAvailabilityMonths: number;
  parameters?: {
    pH: number;
    electricalConductivity: number;
    organicCarbon: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  season?: 'kharif' | 'rabi' | 'zaid' | 'annual';
}

export class CropSuitabilityEngine {
  public static evaluateCrops(input: EvaluationInput): ICropSuitabilityScore[] {
    const targetSeason = input.season || 'kharif';

    const results: ICropSuitabilityScore[] = INDIAN_CROP_BENCHMARKS.map((crop) => {
      let score = 70; // baseline score
      const limitingFactors: string[] = [];
      const agronomicAdvantages: string[] = [];

      // 1. Season matching
      const seasonMatch =
        crop.seasons.includes('year_round') ||
        crop.seasons.includes(targetSeason as any) ||
        targetSeason === 'annual';

      if (seasonMatch) {
        score += 10;
        agronomicAdvantages.push(`Aligned with ${targetSeason.toUpperCase()} sowing calendar`);
      } else {
        score -= 25;
        limitingFactors.push(`Non-ideal season (preferred: ${crop.seasons.join(', ')})`);
      }

      // 2. Soil Type matching
      const normSoil = input.soilType.toLowerCase();
      const soilMatch = crop.suitableSoilTypes.some(
        (st) => normSoil.includes(st) || st.includes(normSoil)
      );
      if (soilMatch) {
        score += 15;
        agronomicAdvantages.push(`Highly compatible with ${input.soilType.replace('_', ' ')} soil texture`);
      } else {
        score -= 15;
        limitingFactors.push(`Soil texture (${input.soilType}) is sub-optimal for root aeration`);
      }

      // 3. Water & Irrigation matching
      if (crop.waterRequirement === 'high') {
        if (input.waterAvailabilityMonths >= 9) {
          score += 10;
          agronomicAdvantages.push(`Sufficient water duration (${input.waterAvailabilityMonths} months)`);
        } else {
          score -= 20;
          limitingFactors.push(`Requires 9+ months assured water (current: ${input.waterAvailabilityMonths} mo)`);
        }
      } else if (crop.waterRequirement === 'low') {
        if (input.waterAvailabilityMonths < 6) {
          score += 15;
          agronomicAdvantages.push('Drought-hardy crop well-suited for limited water window');
        }
      }

      // 4. Chemical Parameters if soil report is provided
      if (input.parameters) {
        const { pH, nitrogen, phosphorus, potassium } = input.parameters;

        // pH range check
        if (pH >= crop.optimalPhRange[0] && pH <= crop.optimalPhRange[1]) {
          score += 10;
          agronomicAdvantages.push(`Soil pH ${pH} is within optimal range (${crop.optimalPhRange.join('-')})`);
        } else {
          score -= 10;
          limitingFactors.push(`Soil pH ${pH} deviates from optimal ${crop.optimalPhRange.join('-')}`);
        }

        // Nitrogen
        if (crop.nitrogenRequirement === 'high' && nitrogen < 240) {
          score -= 10;
          limitingFactors.push('Available Nitrogen is low for high-nitrogen feeder');
        } else if (nitrogen >= 280) {
          score += 5;
        }

        // Phosphorus
        if (crop.phosphorusRequirement === 'high' && phosphorus < 15) {
          score -= 8;
          limitingFactors.push('Phosphorus deficiency will limit early root zone establishment');
        }

        // Potassium
        if (crop.potassiumRequirement === 'high' && potassium < 140) {
          score -= 8;
          limitingFactors.push('Low potassium may reduce disease tolerance and crop stand');
        }
      }

      // Bound score between 25 and 98
      const finalScore = Math.max(25, Math.min(98, score));

      let suitabilityGrade: 'highly_suitable' | 'moderately_suitable' | 'marginally_suitable' | 'not_recommended';
      if (finalScore >= 80) suitabilityGrade = 'highly_suitable';
      else if (finalScore >= 65) suitabilityGrade = 'moderately_suitable';
      else if (finalScore >= 45) suitabilityGrade = 'marginally_suitable';
      else suitabilityGrade = 'not_recommended';

      // Parse expected yield median
      const match = crop.expectedYieldQuintalsPerAcre.match(/(\d+)\s*-\s*(\d+)/);
      const medianYield = match ? (parseInt(match[1]) + parseInt(match[2])) / 2 : 20;
      const estimatedGrossIncomePerAcreInr = Math.round(medianYield * crop.averageMandiPricePerQuintalInr);

      return {
        cropName: crop.cropName,
        botanicalName: crop.botanicalName,
        season: crop.seasons[0],
        category: crop.category,
        suitabilityScore: finalScore,
        suitabilityGrade,
        expectedYieldRangeQuintalsPerAcre: crop.expectedYieldQuintalsPerAcre,
        estimatedGrossIncomePerAcreInr,
        waterRequirementLevel: crop.waterRequirement,
        limitingFactors,
        agronomicAdvantages,
      };
    });

    // Sort by suitability score descending
    return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }
}
