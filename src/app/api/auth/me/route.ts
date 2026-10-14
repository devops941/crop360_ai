import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { authService } from '@/services/auth.service';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return ApiResponseHelper.error('Not authenticated', 401, 'UNAUTHORIZED');
    }

    const payload = await verifyAuthToken(sessionCookie);
    if (!payload || !payload.userId) {
      return ApiResponseHelper.error('Invalid or expired session', 401, 'INVALID_SESSION');
    }

    const user = await authService.getCurrentUser(payload.userId);
    if (!user) {
      return ApiResponseHelper.error('User not found', 404, 'USER_NOT_FOUND');
    }

    return ApiResponseHelper.success(user, 'Session active');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve session';
    return ApiResponseHelper.internalError(message, error);
  }
}
