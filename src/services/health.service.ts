import { checkDatabaseHealth } from '@/lib/mongodb';
import { AppHealthData, DbHealthData } from '@/types';

export class HealthService {
  private static startTime = Date.now();

  static getAppHealth(): AppHealthData {
    return {
      status: 'ok',
      service: process.env.NEXT_PUBLIC_APP_NAME || 'Crop360 AI',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      version: '0.1.0',
    };
  }

  static async getDatabaseHealth(): Promise<DbHealthData> {
    const health = await checkDatabaseHealth();

    if (!health.isConnected) {
      return {
        status: 'disconnected',
        database: health.database,
        latencyMs: health.latencyMs,
        details: health.error || 'Unable to connect to MongoDB server',
      };
    }

    return {
      status: 'connected',
      database: health.database,
      latencyMs: health.latencyMs,
    };
  }
}
