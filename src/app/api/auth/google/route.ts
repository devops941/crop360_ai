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

    const referer = request.headers.get('referer') || '';
    const isRegisterRequest =
      validation.data.mode === 'register' ||
      referer.toLowerCase().includes('/register');

    const authInput = {
      ...validation.data,
      mode: (isRegisterRequest ? 'register' : 'login') as 'login' | 'register',
    };

    const { user, token } = await authService.handleGoogleAuth(authInput);

    const response = ApiResponseHelper.success(
      user,
      isRegisterRequest
        ? 'Account registered and signed in with Google successfully.'
        : 'Signed in with Google successfully.'
    );

    response.cookies.set({
      ...sessionCookieOptions,
      value: token,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google authentication failed';
    const isNotRegistered =
      message.toLowerCase().includes('no registered') ||
      message.toLowerCase().includes('not registered') ||
      message.toLowerCase().includes('register first');
    return ApiResponseHelper.error(
      message,
      isNotRegistered ? 404 : 400,
      isNotRegistered ? 'USER_NOT_REGISTERED' : 'GOOGLE_AUTH_FAILED'
    );
  }
}
