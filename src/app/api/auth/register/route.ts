import { NextRequest } from 'next/server';
import { ApiResponseHelper } from '@/lib/api-response';
import { authService } from '@/services/auth.service';
import { registerSchema, validateRequest } from '@/validators';
import { sessionCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = await validateRequest(registerSchema, body);

    if (!validation.success) {
      return ApiResponseHelper.error(
        'Validation failed',
        422,
        'VALIDATION_ERROR',
        validation.errors
      );
    }

    const { user, token } = await authService.register(validation.data);

    const response = ApiResponseHelper.success(
      user,
      'Account created successfully. Welcome to Crop360 AI!',
      201
    );

    response.cookies.set({
      ...sessionCookieOptions,
      value: token,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return ApiResponseHelper.error(message, 400, 'REGISTRATION_FAILED');
  }
}
