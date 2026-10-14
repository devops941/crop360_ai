import mongoose from 'mongoose';
import { env } from '@/config/env';
import { logger } from './logger';

/**
 * Global interface to cache Mongoose connection across hot-reloads in Next.js development.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB using Mongoose with connection pooling and caching.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      dbName: env.MONGODB_DB_NAME,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    logger.info('Initializing new MongoDB connection...', {
      dbName: env.MONGODB_DB_NAME,
    });

    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then((mongooseInstance) => {
      logger.info('MongoDB connection established successfully');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    logger.error('Failed to connect to MongoDB', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  return cached.conn;
}

export const connectDB = connectToDatabase;

/**
 * Verifies real MongoDB database connectivity using admin ping.
 */
export async function checkDatabaseHealth(): Promise<{
  isConnected: boolean;
  latencyMs: number;
  database: string;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const conn = await connectToDatabase();
    if (!conn.connection.db) {
      throw new Error('Database instance is not initialized');
    }

    // Ping the admin database to verify live read/write capability
    await conn.connection.db.admin().ping();
    const latencyMs = Date.now() - startTime;

    return {
      isConnected: true,
      latencyMs,
      database: conn.connection.name || env.MONGODB_DB_NAME,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
    return {
      isConnected: false,
      latencyMs,
      database: env.MONGODB_DB_NAME,
      error: errorMessage,
    };
  }
}
