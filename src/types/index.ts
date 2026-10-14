export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface AppHealthData {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  uptime: number;
  environment: string;
  version: string;
}

export interface DbHealthData {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  database: string;
  latencyMs?: number;
  details?: string;
}

export interface ApiRootData {
  name: string;
  version: string;
  description: string;
  endpoints: {
    health: string;
    dbHealth: string;
  };
}

export type UserRole = 'farmer' | 'fpo_admin' | 'agronomist' | 'admin';
export type AuthProvider = 'credentials' | 'google';

export interface UserLocation {
  state?: string;
  district?: string;
}

export interface IUser {
  _id?: unknown;
  id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  googleId?: string;
  avatarUrl?: string;
  phone?: string;
  role: UserRole;
  location?: UserLocation;
  landSizeAcres?: number;
  preferredLanguage?: 'en' | 'ta' | 'hi';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider;
  avatarUrl?: string;
  phone?: string;
  location?: UserLocation;
  landSizeAcres?: number;
  preferredLanguage?: 'en' | 'ta' | 'hi';
  createdAt: string | Date;
}

export interface AuthSessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider;
}
