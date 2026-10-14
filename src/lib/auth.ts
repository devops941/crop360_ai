import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { AuthSessionPayload, SafeUser, UserRole, AuthProvider, UserLocation } from '@/types';
import { env } from '@/config/env';

export const AUTH_COOKIE_NAME = 'crop360_session';
const JWT_SECRET_KEY = new TextEncoder().encode(
  env.JWT_SECRET || 'crop360_ai_super_secret_jwt_key_2026_india'
);

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plain text password against a hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token using jose (Edge-runtime and Node.js compatible)
 */
export async function signAuthToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET_KEY);
}

/**
 * Verify and decode an Auth JWT token
 */
export async function verifyAuthToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Convert Mongoose user document or raw object to safe public profile
 */
export function toSafeUser(user: {
  _id?: unknown;
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  authProvider?: AuthProvider;
  avatarUrl?: string;
  phone?: string;
  location?: UserLocation;
  landSizeAcres?: number;
  preferredLanguage?: 'en' | 'ta' | 'hi';
  createdAt?: Date | string;
}): SafeUser {
  return {
    id: String(user.id || user._id || ''),
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'farmer',
    authProvider: user.authProvider || 'credentials',
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    location: user.location,
    landSizeAcres: user.landSizeAcres,
    preferredLanguage: user.preferredLanguage || 'ta',
    createdAt: user.createdAt || new Date(),
  };
}

/**
 * Cookie options for the secure session cookie
 */
export const sessionCookieOptions = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};
