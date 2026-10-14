import { z } from 'zod';

export const farmSchema = z.object({
  farmerId: z.string().min(1, 'Please select a registered farmer'),
  surveyNumber: z.string().min(1, 'Survey / Patta number is required'),
  parcelName: z.string().default('Main Field'),
  totalAreaAcres: z.coerce.number().positive('Total area must be greater than 0'),
  cultivableAreaAcres: z.coerce.number().positive('Cultivable area must be greater than 0'),
  soilType: z
    .enum(['alluvial', 'black_cotton', 'red_loam', 'laterite', 'sandy_loam', 'clayey'])
    .default('alluvial'),
  irrigationSource: z
    .enum(['borewell', 'canal', 'open_well', 'drip', 'sprinkler', 'rainfed'])
    .default('borewell'),
  waterAvailabilityMonths: z.coerce.number().min(1).max(12).default(8),
  village: z.string().optional().or(z.literal('')),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required').default('Tamil Nadu'),
  status: z.enum(['active', 'fallow']).default('active'),
});

export type FarmInput = z.infer<typeof farmSchema>;
