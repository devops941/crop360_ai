export interface GeneratedSowingSpec {
  varietyName: string;
  plantingMethod:
    | 'direct_seeding'
    | 'transplanting'
    | 'dibbling'
    | 'broadcasting'
    | 'drip_fertigation_line'
    | 'furrow_sett_planting'
    | 'ridge_dibbling'
    | 'pit_planting';
  spacingCm: {
    rowToRowCm: number;
    plantToPlantCm: number;
  };
  plantPopulationPerAcre: number;
  nurseryAgeDays?: number;
  durationDays: number;
  actualSeedRateUsedKg: number;
  depthOfSowingCm: number;
}

export class SowingGeneratorService {
  /**
   * Returns ICAR/TNAU standard planting & sowing agronomic parameters for a given crop.
   */
  static getSpec(cropName: string): GeneratedSowingSpec {
    const norm = (cropName || '').toLowerCase();

    // SUGARCANE
    if (norm.includes('sugar') || norm.includes('cane') || norm.includes('karumbu')) {
      return {
        varietyName: 'Co 86032 (Nayana) / Co 0212',
        plantingMethod: 'furrow_sett_planting',
        spacingCm: {
          rowToRowCm: 90,
          plantToPlantCm: 30,
        },
        plantPopulationPerAcre: 29040,
        durationDays: 330,
        actualSeedRateUsedKg: 2500, // 25,000 two-budded setts / ~2.5 tonnes
        depthOfSowingCm: 5,
      };
    }

    // PADDY / RICE
    if (norm.includes('paddy') || norm.includes('rice') || norm.includes('nel') || norm.includes('samba')) {
      return {
        varietyName: 'CO 51 (High Yielding Early Maturing)',
        plantingMethod: 'transplanting',
        spacingCm: {
          rowToRowCm: 20,
          plantToPlantCm: 15,
        },
        plantPopulationPerAcre: 134895,
        nurseryAgeDays: 21,
        durationDays: 115,
        actualSeedRateUsedKg: 18,
        depthOfSowingCm: 2,
      };
    }

    // COTTON
    if (normCropMatch(norm, ['cotton', 'kapas', 'paruthi'])) {
      return {
        varietyName: 'RCH 659 BG II (Bollgard II Hybrid)',
        plantingMethod: 'ridge_dibbling',
        spacingCm: {
          rowToRowCm: 90,
          plantToPlantCm: 60,
        },
        plantPopulationPerAcre: 7407,
        durationDays: 160,
        actualSeedRateUsedKg: 2,
        depthOfSowingCm: 4,
      };
    }

    // MAIZE / CORN
    if (normCropMatch(norm, ['maize', 'corn', 'cholam', 'makka'])) {
      return {
        varietyName: 'COHM 6 / Hybrid Maize',
        plantingMethod: 'ridge_dibbling',
        spacingCm: {
          rowToRowCm: 60,
          plantToPlantCm: 20,
        },
        plantPopulationPerAcre: 33333,
        durationDays: 105,
        actualSeedRateUsedKg: 8,
        depthOfSowingCm: 4,
      };
    }

    // GROUNDNUT / PEANUT
    if (normCropMatch(norm, ['groundnut', 'peanut', 'kadalai', 'manila'])) {
      return {
        varietyName: 'Kadiri 6 (K6) / TMV 7 Bold',
        plantingMethod: 'dibbling',
        spacingCm: {
          rowToRowCm: 30,
          plantToPlantCm: 10,
        },
        plantPopulationPerAcre: 133333,
        durationDays: 110,
        actualSeedRateUsedKg: 55,
        depthOfSowingCm: 5,
      };
    }

    // VEGETABLES: TOMATO
    if (norm.includes('tomato') || norm.includes('thakkali')) {
      return {
        varietyName: 'Shivam F1 / Arka Rakshak',
        plantingMethod: 'transplanting',
        spacingCm: {
          rowToRowCm: 60,
          plantToPlantCm: 45,
        },
        plantPopulationPerAcre: 14815,
        nurseryAgeDays: 25,
        durationDays: 130,
        actualSeedRateUsedKg: 0.15,
        depthOfSowingCm: 3,
      };
    }

    // VEGETABLES: CHILLI
    if (norm.includes('chilli') || norm.includes('pepper') || norm.includes('milagai')) {
      return {
        varietyName: 'K 1 / Teja Super Hot Hybrid',
        plantingMethod: 'transplanting',
        spacingCm: {
          rowToRowCm: 60,
          plantToPlantCm: 45,
        },
        plantPopulationPerAcre: 14815,
        nurseryAgeDays: 30,
        durationDays: 150,
        actualSeedRateUsedKg: 0.25,
        depthOfSowingCm: 2,
      };
    }

    // BANANA
    if (norm.includes('banana') || norm.includes('valai')) {
      return {
        varietyName: 'Grand Naine (G9 Tissue Culture)',
        plantingMethod: 'pit_planting',
        spacingCm: {
          rowToRowCm: 180,
          plantToPlantCm: 180,
        },
        plantPopulationPerAcre: 1250,
        durationDays: 330,
        actualSeedRateUsedKg: 1250,
        depthOfSowingCm: 30,
      };
    }

    // TURMERIC
    if (norm.includes('turmeric') || norm.includes('manjal')) {
      return {
        varietyName: 'BSR 2 / Salem Local Finger Rhizomes',
        plantingMethod: 'dibbling',
        spacingCm: {
          rowToRowCm: 45,
          plantToPlantCm: 15,
        },
        plantPopulationPerAcre: 59259,
        durationDays: 270,
        actualSeedRateUsedKg: 1000,
        depthOfSowingCm: 5,
      };
    }

    // PULSES (Blackgram / Greengram)
    if (norm.includes('pulse') || norm.includes('gram') || norm.includes('ulundu') || norm.includes('payaru')) {
      return {
        varietyName: 'VBN 8 / Vamban High Yielding',
        plantingMethod: 'direct_seeding',
        spacingCm: {
          rowToRowCm: 30,
          plantToPlantCm: 10,
        },
        plantPopulationPerAcre: 133333,
        durationDays: 75,
        actualSeedRateUsedKg: 8,
        depthOfSowingCm: 3,
      };
    }

    // WHEAT
    if (norm.includes('wheat') || norm.includes('godhumai')) {
      return {
        varietyName: 'HD 2967 / Sharbati',
        plantingMethod: 'direct_seeding',
        spacingCm: {
          rowToRowCm: 22,
          plantToPlantCm: 5,
        },
        plantPopulationPerAcre: 363636,
        durationDays: 120,
        actualSeedRateUsedKg: 40,
        depthOfSowingCm: 5,
      };
    }

    // DEFAULT STANDARD
    return {
      varietyName: 'Certified Hybrid / Local Selection',
      plantingMethod: 'direct_seeding',
      spacingCm: {
        rowToRowCm: 45,
        plantToPlantCm: 15,
      },
      plantPopulationPerAcre: 59259,
      durationDays: 110,
      actualSeedRateUsedKg: 15,
      depthOfSowingCm: 3,
    };
  }
}

function normCropMatch(norm: string, keywords: string[]): boolean {
  return keywords.some((k) => norm.includes(k));
}
