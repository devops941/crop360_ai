import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().default('agri'),
  JWT_SECRET: z.string().default('crop360_ai_super_secret_jwt_key_2026_india'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  NEXT_PUBLIC_APP_NAME: z.string().default('Crop360 AI'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional().default(''),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Crop360 AI'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional().default(''),
});

function getValidatedServerEnv() {
  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    JWT_SECRET: process.env.JWT_SECRET || 'crop360_ai_super_secret_jwt_key_2026_india',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  });

  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error('Invalid environment configuration:', formattedErrors);
    throw new Error(`Environment validation failed: ${JSON.stringify(formattedErrors)}`);
  }

  return result.data;
}

function getValidatedClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  });

  if (!result.success) {
    return {
      NEXT_PUBLIC_APP_NAME: 'Crop360 AI',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: '',
    };
  }

  return result.data;
}

// Server-side environment (throws if accessed on client or invalid on server)
export const env =
  typeof window === 'undefined'
    ? getValidatedServerEnv()
    : ({} as ReturnType<typeof getValidatedServerEnv>);

// Client-safe environment
export const publicEnv = getValidatedClientEnv();
