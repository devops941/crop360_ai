'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import {
  Sprout,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  ArrowLeft,
  MapPin,
  Globe,
  Briefcase,
} from 'lucide-react';
import { registerSchema, RegisterInput } from '@/validators/auth.validator';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'farmer',
      state: 'Tamil Nadu',
      district: '',
      preferredLanguage: 'ta',
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed. Please check the details.');
      }

      toast.success(`Welcome to Crop360 AI, ${data.data.name}!`);
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAFAF6]">
      {/* Top back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4 mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#687168] hover:text-[#245C3A] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Crop360 Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
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
          <h2 className="text-2xl font-bold text-[#252B26] tracking-tight">Create Your Account</h2>
          <p className="mt-1 text-xs text-[#687168]">
            Get started with data-backed soil analysis and crop lifecycle roadmaps.
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-xl border border-[#E3E8DF] bg-white p-6 sm:p-8 shadow-xs">
          {/* Google Sign Up */}
          <div>
            <GoogleSignInButton label="Sign up with Google" />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E3E8DF]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#687168] uppercase font-medium tracking-wider">
                Or Register with Details
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#252B26] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Ramesh Kumar"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                      errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-[#E3E8DF]'
                    } bg-white text-[#252B26] placeholder-[#687168]/60 focus:outline-none focus:border-[#245C3A]`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                      errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-[#E3E8DF]'
                    } bg-white text-[#252B26] placeholder-[#687168]/60 focus:outline-none focus:border-[#245C3A]`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#252B26] mb-1">
                  Email Address *
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
                <label className="block text-xs font-semibold text-[#252B26] mb-1">
                  Create Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="At least 6 chars"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                      errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-[#E3E8DF]'
                    } bg-white text-[#252B26] placeholder-[#687168]/60 focus:outline-none focus:border-[#245C3A]`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Role & Preferred Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#252B26] mb-1">
                  Primary Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <select
                    {...register('role')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E8DF] bg-white text-[#252B26] focus:outline-none focus:border-[#245C3A]"
                  >
                    <option value="farmer">Individual Farmer / Landowner</option>
                    <option value="fpo_admin">FPO Representative / Leader</option>
                    <option value="agronomist">Agricultural Consultant / KVK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] mb-1">
                  Preferred Language
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                    <Globe className="h-4 w-4" />
                  </div>
                  <select
                    {...register('preferredLanguage')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E8DF] bg-white text-[#252B26] focus:outline-none focus:border-[#245C3A]"
                  >
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* State & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#252B26] mb-1">State</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    {...register('state')}
                    placeholder="e.g. Tamil Nadu, Maharashtra"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E8DF] bg-white text-[#252B26] focus:outline-none focus:border-[#245C3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B26] mb-1">District</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#687168]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    {...register('district')}
                    placeholder="e.g. Thanjavur, Pune"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E8DF] bg-white text-[#252B26] focus:outline-none focus:border-[#245C3A]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60 mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer switch to login */}
          <div className="mt-6 pt-4 border-t border-[#E3E8DF] text-center text-xs text-[#687168]">
            Already have an account?{' '}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-semibold text-[#245C3A] hover:underline"
            >
              Sign In here
            </Link>
          </div>
        </div>

        {/* Agricultural assurance note */}
        <p className="mt-6 text-center text-[11px] text-[#687168] leading-relaxed">
          By registering, you agree to Crop360 AI terms and privacy policy. Your field coordinates
          and soil data remain confidential.
        </p>
      </div>
    </div>
  );
}
