import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  role: z.enum(['farmer', 'fpo_admin', 'agronomist']).default('farmer'),
  state: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  landSizeAcres: z.coerce.number().min(0, 'Land size cannot be negative').optional(),
  preferredLanguage: z.enum(['en', 'ta', 'hi']).default('ta'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const googleAuthSchema = z.object({
  credential: z.string().optional(),
  code: z.string().optional(),
  userInfo: z
    .object({
      email: z.string().email(),
      name: z.string(),
      picture: z.string().optional(),
      sub: z.string(),
    })
    .optional(),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
