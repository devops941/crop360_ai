'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Sprout, Mail, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { loginSchema, LoginInput } from '@/validators/auth.validator';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      toast.success(`Welcome back, ${data.data.name}!`);
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAFAF6]">
      {/* Top back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#687168] hover:text-[#245C3A] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Crop360 Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#245C3A] text-white">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#252B26]">
              Crop360 <span className="text-[#245C3A]">AI</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-[#252B26] tracking-tight">
            Sign In to Your Account
          </h2>
          <p className="mt-1 text-xs text-[#687168]">
            Access your farm soil records, recommendations, and crop lifecycle plans.
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-xl border border-[#E3E8DF] bg-white p-6 sm:p-8 shadow-xs">
          {/* Google Sign In */}
          <div>
            <GoogleSignInButton label="Continue with Google" />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E3E8DF]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#687168] uppercase font-medium tracking-wider">
                Or with Email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#252B26] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="farmer@example.com"
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                    errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-[#E3E8DF]'
                  } bg-white text-[#252B26] placeholder-[#687168]/60 focus:outline-none focus:border-[#245C3A]`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#252B26]">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                    errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-[#E3E8DF]'
                  } bg-white text-[#252B26] placeholder-[#687168]/60 focus:outline-none focus:border-[#245C3A]`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer switch to register */}
          <div className="mt-6 pt-4 border-t border-[#E3E8DF] text-center text-xs text-[#687168]">
            Don&apos;t have an account yet?{' '}
            <Link
              href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-semibold text-[#245C3A] hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>

        {/* Agricultural assurance note */}
        <p className="mt-6 text-center text-[11px] text-[#687168] leading-relaxed">
          Crop360 AI stores your agricultural and soil data securely. We do not share farmer records
          with third-party marketing entities.
        </p>
      </div>
    </div>
  );
}
