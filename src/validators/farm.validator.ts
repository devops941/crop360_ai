import { z } from 'zod';

export const farmSchema = z.object({
  farmerId: z.string().min(1, 'Please select a registered farmer'),
  surveyNumber: z.string().min(1, 'Survey / Patta number is required'),
  parcelName: z.string().min(1, 'Parcel / Field name is required'),
  totalAreaAcres: z.coerce
    .number({ invalid_type_error: 'Total area is required' })
    .positive('Total area must be greater than 0'),
  cultivableAreaAcres: z.coerce
    .number({ invalid_type_error: 'Cultivable area is required' })
    .positive('Cultivable area must be greater than 0'),
  soilType: z.enum(
    ['alluvial', 'black_cotton', 'red_loam', 'laterite', 'sandy_loam', 'clayey'],
    { errorMap: () => ({ message: 'Please select a soil classification' }) }
  ),
  irrigationSource: z.enum(
    ['borewell', 'canal', 'open_well', 'drip', 'sprinkler', 'rainfed'],
    { errorMap: () => ({ message: 'Please select an irrigation source' }) }
  ),
  waterAvailabilityMonths: z.coerce
    .number({ invalid_type_error: 'Water availability is required' })
    .min(1, 'Must be at least 1 month')
    .max(12, 'Cannot exceed 12 months'),
  village: z.string().optional().or(z.literal('')),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required').default('Tamil Nadu'),
  status: z.enum(['active', 'fallow']).default('active'),
});

export type FarmInput = z.infer<typeof farmSchema>;
