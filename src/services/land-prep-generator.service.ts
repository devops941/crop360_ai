export interface GeneratedTillageOp {
  stepNumber: number;
  operationName: string;
  implementType: 'mouldboard_plough' | 'disc_harrow' | 'cultivator' | 'rotavator' | 'ridger' | 'bund_former' | 'leveler';
  targetDepthInches: number;
  timingDaysBeforeSowing: number;
  purpose: string;
  isCompleted: boolean;
}

export interface GeneratedLandPrepPlan {
  tillageType: 'conventional' | 'minimum_tillage' | 'zero_tillage' | 'puddled_wetland';
  basalFYMApplicationTonnesPerAcre: number;
  soilAmendmentRequired?: string;
  operations: GeneratedTillageOp[];
}

const IMPLEMENT_TYPES = [
  'mouldboard_plough',
  'disc_harrow',
  'cultivator',
  'rotavator',
  'ridger',
  'bund_former',
  'leveler',
] as const;

function sanitizeImplement(impl: string): 'mouldboard_plough' | 'disc_harrow' | 'cultivator' | 'rotavator' | 'ridger' | 'bund_former' | 'leveler' {
  const norm = (impl || '').toLowerCase().replace(/[\s-]/g, '_');
  if (norm.includes('mould') || norm.includes('mold') || norm.includes('plough') || norm.includes('chisel') || norm.includes('subsoil')) {
    return 'mouldboard_plough';
  }
  if (norm.includes('harrow') || norm.includes('disc')) {
    return 'disc_harrow';
  }
  if (norm.includes('rotavator') || norm.includes('rota')) {
    return 'rotavator';
  }
  if (norm.includes('ridge') || norm.includes('furrow')) {
    return 'ridger';
  }
  if (norm.includes('bund')) {
    return 'bund_former';
  }
  if (norm.includes('level')) {
    return 'leveler';
  }
  return 'cultivator';
}

export class LandPrepGeneratorService {
  /**
   * Generate crop-specific land preparation operations using Claude AI or fallback agronomic engine.
   */
  static async generate(cropName: string, soilType: string = 'loam', season: string = 'Kharif'): Promise<GeneratedLandPrepPlan> {
    const normCrop = cropName.toLowerCase();

    // 1. Try Claude AI if API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const prompt = `You are an expert ICAR and TNAU (Tamil Nadu Agricultural University) agronomy specialist.
Provide the standard, realistic sequential land preparation & tillage plan for cultivating "${cropName}" in "${soilType}" soil during "${season}" season.

Strictly adhere to practical Indian agricultural implements: mouldboard_plough, disc_harrow, cultivator, rotavator, ridger, bund_former, leveler.
Provide exactly 4 or 5 chronological operations from primary tillage to final seedbed.

Respond ONLY with a valid JSON object matching this schema, without markdown formatting or code blocks:
{
  "tillageType": "conventional" | "puddled_wetland" | "minimum_tillage",
  "basalFYMApplicationTonnesPerAcre": number,
  "soilAmendmentRequired": "string description e.g. Gypsum 200kg or Pressmud 4t",
  "operations": [
    {
      "stepNumber": 1,
      "operationName": "Specific name of tillage operation",
      "implementType": "mouldboard_plough" | "disc_harrow" | "cultivator" | "rotavator" | "ridger" | "bund_former" | "leveler",
      "targetDepthInches": number,
      "timingDaysBeforeSowing": number,
      "purpose": "Specific agronomic purpose for ${cropName}"
    }
  ]
}`;

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const text = data?.content?.[0]?.text;
          if (text) {
            const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);
            if (parsed && Array.isArray(parsed.operations) && parsed.operations.length > 0) {
              return {
                tillageType: parsed.tillageType === 'puddled_wetland' ? 'puddled_wetland' : 'conventional',
                basalFYMApplicationTonnesPerAcre: Number(parsed.basalFYMApplicationTonnesPerAcre) || 5,
                soilAmendmentRequired: parsed.soilAmendmentRequired || undefined,
                operations: parsed.operations.map((op: any, i: number) => ({
                  stepNumber: i + 1,
                  operationName: String(op.operationName),
                  implementType: sanitizeImplement(op.implementType),
                  targetDepthInches: Number(op.targetDepthInches) || 6,
                  timingDaysBeforeSowing: Number(op.timingDaysBeforeSowing) || 7,
                  purpose: String(op.purpose),
                  isCompleted: false,
                })),
              };
            }
          }
        }
      } catch (aiErr) {
        console.warn('AI Land Prep generator notice, falling back to agronomy engine:', aiErr);
      }
    }

    // 2. Comprehensive ICAR / TNAU Crop-Specific Rule Engine Fallback

    // A. SUGARCANE
    if (normCrop.includes('sugar') || normCrop.includes('cane') || normCrop.includes('karumbu')) {
      return {
        tillageType: 'conventional',
        basalFYMApplicationTonnesPerAcre: 10,
        soilAmendmentRequired: 'Pressmud Cake 4 tonnes/acre or Phospho-Gypsum 250kg/acre',
        operations: [
          {
            stepNumber: 1,
            operationName: 'Deep Subsoiling / Chisel Ploughing (14-16" Depth)',
            implementType: 'mouldboard_plough',
            targetDepthInches: 14,
            timingDaysBeforeSowing: 30,
            purpose: 'Break dense subsoil hardpan to encourage deep sugarcane taproot penetration and high tonnage stool development',
            isCompleted: false,
          },
          {
            stepNumber: 2,
            operationName: 'Cross Disc Harrowing & Heavy Clod Crushing',
            implementType: 'disc_harrow',
            targetDepthInches: 8,
            timingDaysBeforeSowing: 16,
            purpose: 'Pulverize tough clay clods to create a deep, friable, well-aerated seedbed for sett rootlet anchorage',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            operationName: 'Basal FYM & Pressmud Cake Incorporation',
            implementType: 'rotavator',
            targetDepthInches: 6,
            timingDaysBeforeSowing: 7,
            purpose: 'Evenly incorporate 10 tonnes/acre organic compost enriched with Trichoderma viride to prevent sett rot and red rot',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            operationName: 'Deep Furrow Opening (90-120cm Row Spacing) & Ridge Forming',
            implementType: 'ridger',
            targetDepthInches: 10,
            timingDaysBeforeSowing: 2,
            purpose: 'Open 25-30cm deep planting furrows spaced 90cm apart for 2-budded cane sett placement and flow irrigation',
            isCompleted: false,
          },
        ],
      };
    }

    // B. PADDY / RICE
    if (normCrop.includes('paddy') || normCrop.includes('rice') || normCrop.includes('nel') || normCrop.includes('samba')) {
      return {
        tillageType: 'puddled_wetland',
        basalFYMApplicationTonnesPerAcre: 5,
        soilAmendmentRequired: 'Daincha / Sunnhemp green manure incorporation or Gypsum 150kg/acre',
        operations: [
          {
            stepNumber: 1,
            operationName: 'Dry Summer Deep Ploughing',
            implementType: 'mouldboard_plough',
            targetDepthInches: 8,
            timingDaysBeforeSowing: 25,
            purpose: 'Invert soil, expose overwintering stem borer pupae and fungal sclerotia, and solarize topsoil',
            isCompleted: false,
          },
          {
            stepNumber: 2,
            operationName: 'Basal FYM / Green Manure Incorporation',
            implementType: 'rotavator',
            targetDepthInches: 4,
            timingDaysBeforeSowing: 14,
            purpose: 'Incorporate 5 tonnes/acre decomposed FYM or 45-day green manure crop to build soil organic carbon',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            operationName: 'Primary & Secondary Wet Puddling',
            implementType: 'rotavator',
            targetDepthInches: 6,
            timingDaysBeforeSowing: 5,
            purpose: 'Puddle soil with 5cm standing water using rotavator to destroy macro-pores and prevent percolation loss',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            operationName: 'Precision Laser Leveling & Peripheral Bund Trimming',
            implementType: 'leveler',
            targetDepthInches: 0,
            timingDaysBeforeSowing: 1,
            purpose: 'Laser level the mud bed to maintain uniform 2cm shallow water depth across entire field for healthy seedling stand',
            isCompleted: false,
          },
        ],
      };
    }

    // C. COTTON
    if (normCrop.includes('cotton') || normCrop.includes('kapas') || normCrop.includes('paruthi')) {
      return {
        tillageType: 'conventional',
        basalFYMApplicationTonnesPerAcre: 5,
        soilAmendmentRequired: 'Zinc Sulphate 10kg/acre & Magnesium Sulphate 15kg/acre',
        operations: [
          {
            stepNumber: 1,
            operationName: 'Deep Summer Mouldboard Ploughing',
            implementType: 'mouldboard_plough',
            targetDepthInches: 10,
            timingDaysBeforeSowing: 30,
            purpose: 'Invert soil to destroy pink bollworm diapausing larvae and improve deep moisture percolation in black cotton soil',
            isCompleted: false,
          },
          {
            stepNumber: 2,
            operationName: 'Disc Harrowing & Clod Crushing',
            implementType: 'disc_harrow',
            targetDepthInches: 6,
            timingDaysBeforeSowing: 14,
            purpose: 'Pulverize dry black soil clods into fine aggregate seedbed for high cotton germination percentage',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            operationName: 'Basal FYM & Biofertilizer Blending',
            implementType: 'rotavator',
            targetDepthInches: 4,
            timingDaysBeforeSowing: 7,
            purpose: 'Incorporate 5 tonnes/acre FYM with Azospirillum and Phosphobacteria into root zone depth',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            operationName: 'Broadbed Furrow (BBF 90cm) / Ridge Preparation',
            implementType: 'ridger',
            targetDepthInches: 8,
            timingDaysBeforeSowing: 2,
            purpose: 'Form 90cm spaced ridges and furrows to prevent waterlogging during monsoon showers and ensure soil aeration',
            isCompleted: false,
          },
        ],
      };
    }

    // D. MAIZE / CORN
    if (normCrop.includes('maize') || normCrop.includes('corn') || normCrop.includes('cholam')) {
      return {
        tillageType: 'conventional',
        basalFYMApplicationTonnesPerAcre: 5,
        soilAmendmentRequired: 'Zinc Sulphate 10kg/acre basal application',
        operations: [
          {
            stepNumber: 1,
            operationName: 'Primary Deep Mouldboard Ploughing',
            implementType: 'mouldboard_plough',
            targetDepthInches: 9,
            timingDaysBeforeSowing: 25,
            purpose: 'Break hard soil crust, destroy perennial weed rhizomes, and maximize rainwater absorption capacity',
            isCompleted: false,
          },
          {
            stepNumber: 2,
            operationName: 'Secondary Disc Harrowing & Levelling',
            implementType: 'disc_harrow',
            targetDepthInches: 5,
            timingDaysBeforeSowing: 12,
            purpose: 'Pulverize clods to create a firm, crumbly seedbed necessary for rapid maize coleoptile emergence',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            operationName: 'Basal FYM & Micro-Nutrient Incorporation',
            implementType: 'rotavator',
            targetDepthInches: 4,
            timingDaysBeforeSowing: 7,
            purpose: 'Thoroughly blend 5 tonnes/acre FYM and zinc sulphate into top 10cm soil layer',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            operationName: 'Ridge and Furrow Alignment (60cm Spacing)',
            implementType: 'ridger',
            targetDepthInches: 6,
            timingDaysBeforeSowing: 2,
            purpose: 'Form uniform 60cm spaced ridges for dibbling single maize seeds at 20cm intra-row spacing',
            isCompleted: false,
          },
        ],
      };
    }

    // E. GROUNDNUT / PEANUT
    if (normCrop.includes('groundnut') || normCrop.includes('peanut') || normCrop.includes('kadalai')) {
      return {
        tillageType: 'conventional',
        basalFYMApplicationTonnesPerAcre: 5,
        soilAmendmentRequired: 'Gypsum 200kg/acre (Calcium & Sulphur for pod pod-filling)',
        operations: [
          {
            stepNumber: 1,
            operationName: 'Deep Disc Ploughing (8-10" Depth)',
            implementType: 'disc_harrow',
            targetDepthInches: 8,
            timingDaysBeforeSowing: 21,
            purpose: 'Loosen topsoil and eliminate soil-borne collar rot pathogens through sun exposure',
            isCompleted: false,
          },
          {
            stepNumber: 2,
            operationName: 'Rotavator Clod Pulverization for Loose Tilth',
            implementType: 'rotavator',
            targetDepthInches: 5,
            timingDaysBeforeSowing: 10,
            purpose: 'Create extremely soft, friable, uncompacted soil texture crucial for uninhibited gynophore peg penetration',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            operationName: 'Basal FYM & Gypsum Incorporation',
            implementType: 'rotavator',
            targetDepthInches: 4,
            timingDaysBeforeSowing: 5,
            purpose: 'Distribute 5 tonnes/acre FYM with 100kg/acre gypsum to provide essential calcium for pod development',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            operationName: 'Broadbed Furrow (BBF 30cm) Bed Making',
            implementType: 'ridger',
            targetDepthInches: 5,
            timingDaysBeforeSowing: 2,
            purpose: 'Prepare 30cm wide raised beds with drainage furrows to prevent water stagnation and ease pod harvesting',
            isCompleted: false,
          },
        ],
      };
    }

    // F. VEGETABLES / HORTICULTURE (Tomato, Chilli, Brinjal, Onion)
    if (normCrop.includes('tomato') || normCrop.includes('chilli') || normCrop.includes('brinjal') || normCrop.includes('onion') || normCrop.includes('vegetable')) {
      return {
        tillageType: 'conventional',
        basalFYMApplicationTonnesPerAcre: 8,
        soilAmendmentRequired: 'Neem Cake 150kg/acre & Trichoderma 2kg/acre',
        operations: [
          {
            stepNumber: 1,
            operationName: 'Primary Deep Soil Tillage & Solarization',
            implementType: 'mouldboard_plough',
            targetDepthInches: 8,
            timingDaysBeforeSowing: 20,
            purpose: 'Invert soil and solarize to eradicate bacterial wilt (Ralstonia) and root-knot nematode eggs',
            isCompleted: false,
          },
          {
            stepNumber: 2,
            operationName: 'Fine Rotavation & Bio-Compost Incorporation',
            implementType: 'rotavator',
            targetDepthInches: 4,
            timingDaysBeforeSowing: 10,
            purpose: 'Pulverize soil to garden tilth and incorporate 8 tonnes/acre vermicompost + neem cake',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            operationName: 'Raised Bed Preparation (90cm Top Width)',
            implementType: 'ridger',
            targetDepthInches: 8,
            timingDaysBeforeSowing: 4,
            purpose: 'Form 90cm wide raised planting beds with 30cm furrows for superior root aeration and drainage',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            operationName: 'Drip Lateral Alignment & Bed Finishing',
            implementType: 'leveler',
            targetDepthInches: 0,
            timingDaysBeforeSowing: 1,
            purpose: 'Lay inline drip lateral lines along bed center and prepare seedbed surface for seedling transplanting',
            isCompleted: false,
          },
        ],
      };
    }

    // G. BANANA
    if (normCrop.includes('banana') || normCrop.includes('valai')) {
      return {
        tillageType: 'conventional',
        basalFYMApplicationTonnesPerAcre: 10,
        soilAmendmentRequired: 'Neem Cake 250kg/acre & Single Super Phosphate 100kg/acre',
        operations: [
          {
            stepNumber: 1,
            operationName: 'Deep Cross Ploughing to 12" Depth',
            implementType: 'mouldboard_plough',
            targetDepthInches: 12,
            timingDaysBeforeSowing: 30,
            purpose: 'Open compacted subsoil to facilitate extensive lateral and anchoring root spread of banana mats',
            isCompleted: false,
          },
          {
            stepNumber: 2,
            operationName: 'Disc Harrowing & Fine Levelling',
            implementType: 'disc_harrow',
            targetDepthInches: 6,
            timingDaysBeforeSowing: 18,
            purpose: 'Break clods and level terrain uniformly to enable efficient flood or furrow basin irrigation',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            operationName: 'Planting Pit Opening (60 x 60 x 60 cm)',
            implementType: 'cultivator',
            targetDepthInches: 24,
            timingDaysBeforeSowing: 10,
            purpose: 'Excavate 2x2x2 feet planting pits at 1.8m x 1.8m spacing and sun-cure pits for 10 days',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            operationName: 'Basal Manure & Topsoil Pit Refilling',
            implementType: 'rotavator',
            targetDepthInches: 12,
            timingDaysBeforeSowing: 2,
            purpose: 'Refill pits with mixture of topsoil, 10kg FYM, 250g neem cake, and 20g carbofuran to safeguard suckers',
            isCompleted: false,
          },
        ],
      };
    }

    // Default Generic ICAR Standard
    return {
      tillageType: 'conventional',
      basalFYMApplicationTonnesPerAcre: 5,
      soilAmendmentRequired: 'Well-decomposed Farmyard Manure 5 tonnes/acre',
      operations: [
        {
          stepNumber: 1,
          operationName: `Deep Summer Mouldboard Ploughing for ${cropName}`,
          implementType: 'mouldboard_plough',
          targetDepthInches: 9,
          timingDaysBeforeSowing: 25,
          purpose: `Invert topsoil, eliminate perennial weed roots, and destroy insect pupae for ${cropName}`,
          isCompleted: false,
        },
        {
          stepNumber: 2,
          operationName: 'Secondary Disc Harrowing & Clod Crushing',
          implementType: 'disc_harrow',
          targetDepthInches: 6,
          timingDaysBeforeSowing: 14,
          purpose: 'Pulverize dry clods into fine aggregate seedbed for optimum seed-soil contact',
          isCompleted: false,
        },
        {
          stepNumber: 3,
          operationName: 'Basal FYM Application & Rotavator Blending',
          implementType: 'rotavator',
          targetDepthInches: 4,
          timingDaysBeforeSowing: 7,
          purpose: 'Thoroughly blend 5 tonnes/acre organic compost into top 10cm soil layer',
          isCompleted: false,
        },
        {
          stepNumber: 4,
          operationName: 'Broadbed Furrow (BBF) / Ridge Formation',
          implementType: 'ridger',
          targetDepthInches: 6,
          timingDaysBeforeSowing: 2,
          purpose: `Form uniform planting beds tailored for root aeration and irrigation drainage of ${cropName}`,
          isCompleted: false,
        },
      ],
    };
  }
}
