export interface CreateSoilReportDto {
  farmerId: string;
  farmId: string;
  testDate?: string;
  testingLabName: string;
  testingLabCode?: string;
  sourceType?: 'manual_entry' | 'lab_pdf' | 'iot_sensor';
  sampleDepthInches?: number;
  parameters: {
    pH: number;
    electricalConductivity: number;
    organicCarbon: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    sulphur?: number;
    zinc?: number;
    boron?: number;
    iron?: number;
    manganese?: number;
    copper?: number;
  };
  rawPdfUrl?: string;
  notes?: string;
}

export interface UpdateSoilReportDto extends Partial<CreateSoilReportDto> {
  status?: 'pending' | 'analyzed' | 'card_generated' | 'rejected';
}

export function validateSoilReportInput(data: Partial<CreateSoilReportDto>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.farmerId?.trim()) {
    errors.farmerId = 'Farmer selection is required';
  }

  if (!data.farmId?.trim()) {
    errors.farmId = 'Farm parcel selection is required';
  }

  if (!data.testingLabName?.trim()) {
    errors.testingLabName = 'Testing laboratory name is required';
  }

  const p = data.parameters;
  if (!p) {
    errors.parameters = 'Soil test parameters are required';
  } else {
    if (typeof p.pH !== 'number' || isNaN(p.pH) || p.pH < 3.0 || p.pH > 11.0) {
      errors['parameters.pH'] = 'pH must be a valid number between 3.0 and 11.0';
    }
    if (typeof p.electricalConductivity !== 'number' || isNaN(p.electricalConductivity) || p.electricalConductivity < 0) {
      errors['parameters.electricalConductivity'] = 'EC must be a positive number';
    }
    if (typeof p.organicCarbon !== 'number' || isNaN(p.organicCarbon) || p.organicCarbon < 0) {
      errors['parameters.organicCarbon'] = 'Organic carbon % must be 0 or higher';
    }
    if (typeof p.nitrogen !== 'number' || isNaN(p.nitrogen) || p.nitrogen < 0) {
      errors['parameters.nitrogen'] = 'Nitrogen (N) kg/ha is required';
    }
    if (typeof p.phosphorus !== 'number' || isNaN(p.phosphorus) || p.phosphorus < 0) {
      errors['parameters.phosphorus'] = 'Phosphorus (P) kg/ha is required';
    }
    if (typeof p.potassium !== 'number' || isNaN(p.potassium) || p.potassium < 0) {
      errors['parameters.potassium'] = 'Potassium (K) kg/ha is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
