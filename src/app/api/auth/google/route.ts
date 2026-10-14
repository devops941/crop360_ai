import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { authService } from '@/services/auth.service';
import { googleAuthSchema, validateRequest } from '@/validators';
import { sessionCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = await validateRequest(googleAuthSchema, body);

    if (!validation.success) {
      return ApiResponseHelper.error(
        'Invalid Google authentication payload',
        422,
        'VALIDATION_ERROR',
        validation.errors
      );
    }

    const { user, token } = await authService.handleGoogleAuth(validation.data);

    const response = ApiResponseHelper.success(user, 'Signed in with Google successfully.');

    response.cookies.set({
      ...sessionCookieOptions,
      value: token,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google authentication failed';
    return ApiResponseHelper.error(message, 400, 'GOOGLE_AUTH_FAILED');
  }
}
