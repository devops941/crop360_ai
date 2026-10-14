import { ISoilReport } from '@/models/soil-report.model';
import { INutrientAnalysis, IRemediationPlan, SoilAnalysisResult } from '@/models/soil-analysis.model';

export class SoilAnalysisService {
  /**
   * Evaluates soil report parameters against ICAR Indian agronomic benchmarks
   */
  public static analyzeReport(report: ISoilReport) {
    const { parameters } = report;
    const nutrients: INutrientAnalysis[] = [];
    const actionPlan: IRemediationPlan[] = [];

    // 1. pH Assessment
    let soilPhCategory: 'strongly_acidic' | 'moderately_acidic' | 'neutral' | 'moderately_alkaline' | 'strongly_alkaline' = 'neutral';
    if (parameters.pH < 5.5) {
      soilPhCategory = 'strongly_acidic';
      actionPlan.push({
        category: 'soil_amendment',
        action: 'Agricultural Lime (CaCO3) Application',
        recommendation: 'Soil is strongly acidic. Apply agricultural lime to raise soil pH to optimal 6.5 range.',
        dosagePerAcre: '200 - 300 kg / acre',
        timing: 'During summer pre-ploughing, 3 weeks before sowing',
        priority: 'immediate',
      });
    } else if (parameters.pH < 6.5) {
      soilPhCategory = 'moderately_acidic';
      actionPlan.push({
        category: 'soil_amendment',
        action: 'Dolomite / Biochar Incorporation',
        recommendation: 'Mild acidity detected. Incorporate farm yard manure or dolomite to buffer root zone.',
        dosagePerAcre: '100 kg / acre',
        timing: '15 days before sowing',
        priority: 'recommended',
      });
    } else if (parameters.pH <= 7.8) {
      soilPhCategory = 'neutral';
    } else if (parameters.pH <= 8.5) {
      soilPhCategory = 'moderately_alkaline';
      actionPlan.push({
        category: 'soil_amendment',
        action: 'Gypsum (CaSO4·2H2O) Application',
        recommendation: 'Alkaline condition reduces phosphorus uptake. Apply agricultural gypsum.',
        dosagePerAcre: '150 - 250 kg / acre',
        timing: 'Basal application before secondary tillage',
        priority: 'immediate',
      });
    } else {
      soilPhCategory = 'strongly_alkaline';
      actionPlan.push({
        category: 'soil_amendment',
        action: 'Sulphur + Gypsum Intensive Treatment',
        recommendation: 'High salinity/alkalinity risk. Deep drainage and gypsum application required.',
        dosagePerAcre: '400 kg / acre + green manuring',
        timing: 'Immediate pre-monsoon wash',
        priority: 'immediate',
      });
    }

    nutrients.push({
      parameter: 'pH (Reaction)',
      value: parameters.pH,
      unit: 'pH Scale',
      benchmarkRange: '6.5 - 7.5',
      rating: parameters.pH >= 6.5 && parameters.pH <= 7.5 ? 'optimal' : parameters.pH < 6.5 ? 'low' : 'high',
      deviationPercentage: Number((((parameters.pH - 7.0) / 7.0) * 100).toFixed(1)),
    });

    // 2. Electrical Conductivity (EC)
    const ecRating = parameters.electricalConductivity < 1.0 ? 'optimal' : parameters.electricalConductivity <= 2.0 ? 'medium' : 'excessive';
    nutrients.push({
      parameter: 'Electrical Conductivity (EC)',
      value: parameters.electricalConductivity,
      unit: 'dS/m',
      benchmarkRange: '< 1.0 dS/m (Normal)',
      rating: ecRating,
      deviationPercentage: Number((parameters.electricalConductivity * 10).toFixed(1)),
    });

    // 3. Organic Carbon (OC %)
    let ocRating: 'deficient' | 'low' | 'medium' | 'optimal' = 'medium';
    if (parameters.organicCarbon < 0.4) {
      ocRating = 'deficient';
      actionPlan.push({
        category: 'organic_matter',
        action: 'Farmyard Manure (FYM) / Vermicompost Enrichment',
        recommendation: 'Soil organic carbon is critical for nutrient retention and microbial activity.',
        dosagePerAcre: '4 - 5 tonnes well-decomposed FYM / acre',
        timing: 'Primary tillage',
        priority: 'immediate',
      });
    } else if (parameters.organicCarbon < 0.5) {
      ocRating = 'low';
      actionPlan.push({
        category: 'organic_matter',
        action: 'Green Manuring (Dhaincha/Sunn hemp)',
        recommendation: 'Grow green manure crops for 45 days and plough in situ before main crop.',
        dosagePerAcre: '20 kg seed / acre',
        timing: 'Pre-monsoon',
        priority: 'recommended',
      });
    } else if (parameters.organicCarbon <= 0.75) {
      ocRating = 'medium';
    } else {
      ocRating = 'optimal';
    }

    nutrients.push({
      parameter: 'Organic Carbon (OC)',
      value: parameters.organicCarbon,
      unit: '%',
      benchmarkRange: '0.50 - 0.75 %',
      rating: ocRating,
      deviationPercentage: Number((((parameters.organicCarbon - 0.6) / 0.6) * 100).toFixed(1)),
    });

    // 4. Nitrogen (N kg/ha)
    let nRating: 'deficient' | 'low' | 'medium' | 'optimal' | 'high' = 'medium';
    if (parameters.nitrogen < 200) {
      nRating = 'deficient';
      actionPlan.push({
        category: 'primary_fertilizer',
        action: 'Split Urea / Neem-Coated Urea Application',
        recommendation: 'Severe nitrogen deficiency will stun vegetative canopy. Split application reduces volatilization.',
        dosagePerAcre: '45 kg Urea in 3 equal splits',
        timing: 'Basal, Tillering/30 DAS, Panicle/50 DAS',
        priority: 'immediate',
      });
    } else if (parameters.nitrogen < 280) {
      nRating = 'low';
      actionPlan.push({
        category: 'primary_fertilizer',
        action: 'Azospirillum / Azotobacter Biofertilizer',
        recommendation: 'Seed inoculation and basal organic nitrogen booster.',
        dosagePerAcre: '2 kg biofertilizer + 30 kg Urea / acre',
        timing: 'Seed treatment and early vegetative',
        priority: 'recommended',
      });
    } else if (parameters.nitrogen <= 560) {
      nRating = 'optimal';
    } else {
      nRating = 'high';
    }

    nutrients.push({
      parameter: 'Available Nitrogen (N)',
      value: parameters.nitrogen,
      unit: 'kg/ha',
      benchmarkRange: '280 - 560 kg/ha',
      rating: nRating,
      deviationPercentage: Number((((parameters.nitrogen - 350) / 350) * 100).toFixed(1)),
    });

    // 5. Phosphorus (P kg/ha)
    let pRating: 'deficient' | 'low' | 'medium' | 'optimal' | 'high' = 'medium';
    if (parameters.phosphorus < 10) {
      pRating = 'deficient';
      actionPlan.push({
        category: 'primary_fertilizer',
        action: 'Single Super Phosphate (SSP) / DAP + PSB',
        recommendation: 'Low phosphorus directly suppresses root elongation and early seedling vigor.',
        dosagePerAcre: '50 kg SSP + 2 kg Phosphobacteria per acre',
        timing: '100% as basal application during final harrowing',
        priority: 'immediate',
      });
    } else if (parameters.phosphorus < 23) {
      pRating = 'medium';
    } else {
      pRating = 'optimal';
    }

    nutrients.push({
      parameter: 'Available Phosphorus (P)',
      value: parameters.phosphorus,
      unit: 'kg/ha',
      benchmarkRange: '23 - 56 kg/ha',
      rating: pRating,
      deviationPercentage: Number((((parameters.phosphorus - 30) / 30) * 100).toFixed(1)),
    });

    // 6. Potassium (K kg/ha)
    let kRating: 'deficient' | 'low' | 'medium' | 'optimal' | 'high' = 'medium';
    if (parameters.potassium < 110) {
      kRating = 'deficient';
      actionPlan.push({
        category: 'primary_fertilizer',
        action: 'Muriate of Potash (MOP) Application',
        recommendation: 'Potassium is vital for drought tolerance, pest resistance, and grain weight filling.',
        dosagePerAcre: '30 kg MOP / acre',
        timing: '50% basal + 50% at flowering',
        priority: 'immediate',
      });
    } else if (parameters.potassium < 280) {
      kRating = 'medium';
    } else {
      kRating = 'optimal';
    }

    nutrients.push({
      parameter: 'Available Potassium (K)',
      value: parameters.potassium,
      unit: 'kg/ha',
      benchmarkRange: '140 - 280 kg/ha',
      rating: kRating,
      deviationPercentage: Number((((parameters.potassium - 200) / 200) * 100).toFixed(1)),
    });

    // 7. Micronutrients (Zinc, Boron) if available
    if (parameters.zinc !== undefined) {
      const znRating = parameters.zinc < 0.6 ? 'deficient' : 'optimal';
      nutrients.push({
        parameter: 'Available Zinc (Zn)',
        value: parameters.zinc,
        unit: 'ppm',
        benchmarkRange: '> 0.60 ppm',
        rating: znRating,
        deviationPercentage: Number((((parameters.zinc - 0.8) / 0.8) * 100).toFixed(1)),
      });

      if (znRating === 'deficient') {
        actionPlan.push({
          category: 'micronutrient',
          action: 'Zinc Sulphate (ZnSO4 21%) Soil Application',
          recommendation: 'Zinc deficiency causes khaira disease in paddy and chlorosis in cereals.',
          dosagePerAcre: '10 kg ZnSO4 / acre (do NOT mix directly with DAP)',
          timing: 'Basal application',
          priority: 'immediate',
        });
      }
    }

    // Health Score Calculation (weighted: pH 20%, OC 25%, N 20%, P 15%, K 15%, EC 5%)
    let score = 100;
    if (soilPhCategory.includes('strongly')) score -= 20;
    else if (soilPhCategory.includes('moderately')) score -= 10;

    if (ocRating === 'deficient') score -= 25;
    else if (ocRating === 'low') score -= 15;
    else if (ocRating === 'medium') score -= 5;

    if (nRating === 'deficient') score -= 20;
    else if (nRating === 'low') score -= 10;

    if (pRating === 'deficient') score -= 15;
    else if (pRating === 'medium') score -= 5;

    if (kRating === 'deficient') score -= 15;
    else if (kRating === 'medium') score -= 5;

    if (ecRating === 'excessive') score -= 10;

    score = Math.max(20, Math.min(98, score));

    const fertilityRating =
      score >= 80 ? 'exceptional' : score >= 65 ? 'good' : score >= 45 ? 'moderate' : 'poor';

    const remediationSummary = `Soil test reveals ${soilPhCategory.replace('_', ' ')} reaction with ${fertilityRating} natural fertility index (${score}/100). Organic carbon is ${ocRating}. Immediate priority is ${actionPlan[0]?.action || 'maintenance dosage'}.`;

    const nextDate = new Date();
    nextDate.setFullYear(nextDate.getFullYear() + 2);

    return {
      reportId: report._id,
      farmerId: report.farmerId,
      farmId: report.farmId,
      analysisDate: new Date(),
      overallHealthScore: score,
      fertilityRating,
      soilPhCategory,
      remediationSummary,
      nutrients,
      actionPlan,
      vernacularSummary: {
        en: `Your field soil health index is ${score}/100 (${fertilityRating.toUpperCase()}). Recommended amendment: ${actionPlan[0]?.action || 'Standard maintenance'}.`,
        ta: `உங்கள் நிலத்தின் மண் வள குறியீடு: ${score}/100 (${fertilityRating === 'good' ? 'நல்ல வளம்' : 'நடுத்தர வளம்'}). முக்கிய பரிந்துரை: ${actionPlan[0]?.action || 'வழக்கமான உரம்'}.`,
        hi: `आपकी भूमि की मृदा स्वास्थ्य रेटिंग: ${score}/100 (${fertilityRating === 'good' ? 'उत्तम' : 'मध्यम'})। मुख्य सलाह: ${actionPlan[0]?.action || 'सामान्य खाद'}।`,
      },
      recommendedNextSampleMonth: nextDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    };
  }

  public static async executeAnalysis(report: ISoilReport) {
    const analysisData = this.analyzeReport(report);
    const existing = await SoilAnalysisResult.findOne({ reportId: report._id });

    if (existing) {
      Object.assign(existing, analysisData);
      await existing.save();
      return existing;
    }

    return SoilAnalysisResult.create(analysisData);
  }
}
