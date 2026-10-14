import { NextResponse } from 'next/server';
import { ApiResponse as IApiResponse } from '@/types';
import { logger } from './logger';

export class ApiResponseHelper {
  static success<T>(
    data: T,
    message = 'Operation successful',
    status = 200
  ): NextResponse<IApiResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  static error(
    message = 'An error occurred',
    status = 400,
    code = 'BAD_REQUEST',
    details?: unknown
  ): NextResponse<IApiResponse<null>> {
    logger.warn(`API Error [${code}]: ${message}`, { status, details });

    return NextResponse.json(
      {
        success: false,
        message,
        error: {
          code,
          ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
        },
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  static internalError(
    message = 'Internal server error',
    error?: unknown
  ): NextResponse<IApiResponse<null>> {
    logger.error('Unhandled API Exception', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        message,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export class ApiResponse {
  static success<T>(data: T, message = 'Success', status = 200) {
    return ApiResponseHelper.success(data, message, status);
  }

  static created<T>(data: T, message = 'Created successfully') {
    return ApiResponseHelper.success(data, message, 201);
  }

  static badRequest(message = 'Bad Request', details?: unknown) {
    return ApiResponseHelper.error(message, 400, 'BAD_REQUEST', details);
  }

  static notFound(message = 'Resource not found') {
    return ApiResponseHelper.error(message, 404, 'NOT_FOUND');
  }

  static serverError(message = 'Internal server error', details?: unknown) {
    return ApiResponseHelper.internalError(message, details);
  }
}
