export interface SeedCatalogEntry {
  cropName: string;
  varietyName: string;
  sourceBreeder: string;
  seedCategory: 'certified' | 'foundation' | 'hybrid' | 'traditional_desi';
  germinationRatePercent: number;
  seedRatePerAcreKg: string;
  seedRateKgNumber: number;
  costPerKgInr: number;
  durationDays: string;
  pestResistanceTraits: string[];
  seedTreatmentAdvisory: {
    fungicideTreatment: string;
    biofertilizerInoculation: string;
    soakingDurationHours: number;
  };
}

export const INDIAN_SEEDS_CATALOG: SeedCatalogEntry[] = [
  {
    cropName: 'Paddy (Rice / Samba / Kuruvai)',
    varietyName: 'CO 51 (High Yielding Early Maturing)',
    sourceBreeder: 'Tamil Nadu Agricultural University (TNAU)',
    seedCategory: 'certified',
    germinationRatePercent: 90,
    seedRatePerAcreKg: '16 - 20 kg',
    seedRateKgNumber: 18,
    costPerKgInr: 45,
    durationDays: '105 - 110 days',
    pestResistanceTraits: ['Blast tolerant', 'Moderate gall midge resistance', 'Non-lodging'],
    seedTreatmentAdvisory: {
      fungicideTreatment: 'Pseudomonas fluorescens @ 10g/kg seed or Carbendazim @ 2g/kg',
      biofertilizerInoculation: 'Azospirillum & Phosphobacteria @ 600g / acre seed rate',
      soakingDurationHours: 12,
    },
  },
  {
    cropName: 'Paddy (Rice / Samba / Kuruvai)',
    varietyName: 'BPT 5204 (Samba Mahsuri Fine Grain)',
    sourceBreeder: 'Acharya N. G. Ranga Agricultural University (ANGRAU)',
    seedCategory: 'certified',
    germinationRatePercent: 88,
    seedRatePerAcreKg: '15 - 18 kg',
    seedRateKgNumber: 16,
    costPerKgInr: 55,
    durationDays: '140 - 150 days',
    pestResistanceTraits: ['Bacterial Leaf Blight resistant', 'High consumer price premium'],
    seedTreatmentAdvisory: {
      fungicideTreatment: 'Trichoderma viride @ 4g/kg seed',
      biofertilizerInoculation: 'Azospirillum @ 200g per 10kg seed slurry',
      soakingDurationHours: 24,
    },
  },
  {
    cropName: 'Cotton (Bt Cotton / Kapas)',
    varietyName: 'RCH 659 BG II (Bollgard II Hybrid)',
    sourceBreeder: 'Rasi Seeds / ICAR Central Institute for Cotton Research',
    seedCategory: 'hybrid',
    germinationRatePercent: 85,
    seedRatePerAcreKg: '1.8 - 2.2 kg (2 packets)',
    seedRateKgNumber: 2,
    costPerKgInr: 950,
    durationDays: '160 - 170 days',
    pestResistanceTraits: ['Helicoverpa American Bollworm resistance', 'Spodoptera resistance'],
    seedTreatmentAdvisory: {
      fungicideTreatment: 'Imidacloprid 70 WS @ 5g/kg + Thiram @ 3g/kg',
      biofertilizerInoculation: 'Azotobacter @ 25g/packet seed slurry',
      soakingDurationHours: 0,
    },
  },
  {
    cropName: 'Maize (Corn / Makka Cholam)',
    varietyName: 'CoH(M) 8 (Single Cross High Starch Hybrid)',
    sourceBreeder: 'TNAU Coimbatore',
    seedCategory: 'hybrid',
    germinationRatePercent: 92,
    seedRatePerAcreKg: '7.5 - 8.0 kg',
    seedRateKgNumber: 8,
    costPerKgInr: 280,
    durationDays: '100 - 105 days',
    pestResistanceTraits: ['Downy mildew resistant', 'Fall Armyworm (FAW) tolerant'],
    seedTreatmentAdvisory: {
      fungicideTreatment: 'Metalaxyl @ 4g/kg + Chlorpyriphos 20EC @ 4ml/kg',
      biofertilizerInoculation: 'Azospirillum + PSB @ 50g/kg seed',
      soakingDurationHours: 0,
    },
  },
  {
    cropName: 'Groundnut (Peanut / Verkadalai)',
    varietyName: 'TMV (Gn) 13 (Spanish Bunch Semidwarf)',
    sourceBreeder: 'Oilseeds Research Station, Tindivanam',
    seedCategory: 'foundation',
    germinationRatePercent: 85,
    seedRatePerAcreKg: '50 - 55 kg kernels',
    seedRateKgNumber: 52,
    costPerKgInr: 120,
    durationDays: '100 - 105 days',
    pestResistanceTraits: ['Tikka leaf spot tolerant', 'Rust tolerant', 'High shelling % (71%)'],
    seedTreatmentAdvisory: {
      fungicideTreatment: 'Trichoderma harzianum @ 4g/kg seed kernels',
      biofertilizerInoculation: 'Rhizobium (Bradyrhizobium) @ 200g/acre kernels with rice gruel',
      soakingDurationHours: 0,
    },
  },
  {
    cropName: 'Blackgram (Urad Dal / Ulundu)',
    varietyName: 'VBN 8 (Non-shattering Short Duration Pulse)',
    sourceBreeder: 'National Pulses Research Centre, Vamban',
    seedCategory: 'certified',
    germinationRatePercent: 88,
    seedRatePerAcreKg: '8 - 10 kg',
    seedRateKgNumber: 9,
    costPerKgInr: 140,
    durationDays: '65 - 70 days',
    pestResistanceTraits: ['Mungbean Yellow Mosaic Virus (MYMV) resistant', 'Synchronous maturity'],
    seedTreatmentAdvisory: {
      fungicideTreatment: 'Carbendazim @ 2g/kg seed',
      biofertilizerInoculation: 'Rhizobium strain VPR 1 + Phosphobacteria @ 30g/kg',
      soakingDurationHours: 2,
    },
  },
];
