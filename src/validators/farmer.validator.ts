import { z } from 'zod';

export const farmerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  aadhaarLastFour: z
    .string()
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .optional()
    .or(z.literal('')),
  category: z.enum(['marginal', 'small', 'medium', 'large']).default('small'),
  village: z.string().optional().or(z.literal('')),
  panchayat: z.string().optional().or(z.literal('')),
  taluk: z.string().optional().or(z.literal('')),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required').default('Tamil Nadu'),
  pincode: z.string().optional().or(z.literal('')),
  preferredLanguage: z.enum(['en', 'ta', 'hi']).default('ta'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type FarmerInput = z.infer<typeof farmerSchema>;
