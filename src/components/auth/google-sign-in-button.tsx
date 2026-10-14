'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  label?: string;
}

export function GoogleSignInButton({ label = 'Continue with Google' }: GoogleSignInButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '362181837457-i3tj8e66mm4mpraqc7l761q948jmvkb6.apps.googleusercontent.com';

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        toast.error('Google did not return credentials. Please try again.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Google authentication failed');
        }

        toast.success(`Welcome, ${data.data.name}! Signed in with Google.`);
        router.push(callbackUrl);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Google authentication failed');
      } finally {
        setLoading(false);
      }
    },
    [callbackUrl, router]
  );

  useEffect(() => {
    if (!scriptLoaded) return;

    // @ts-expect-error Google Identity Services loaded dynamically
    if (typeof window !== 'undefined' && window.google?.accounts?.id && googleClientId) {
      try {
        // @ts-expect-error Google Identity Services
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        if (googleBtnContainerRef.current) {
          // Render official Google button
          // @ts-expect-error Google Identity Services
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: label.toLowerCase().includes('sign up') ? 'signup_with' : 'signin_with',
            logo_alignment: 'left',
            width: googleBtnContainerRef.current.clientWidth || 380,
          });
        }
      } catch (e) {
        console.error('Error initializing Google Sign-In:', e);
      }
    }
  }, [scriptLoaded, googleClientId, label, handleCredentialResponse]);

  const handleCustomButtonClick = () => {
    // @ts-expect-error Google Identity Services
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      // @ts-expect-error Google Identity Services
      window.google.accounts.id.prompt();
    } else {
      toast.info('Google Sign-In is initializing. Please click again in a moment.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Load Google Identity Services */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Container for Official Google Button */}
      <div
        ref={googleBtnContainerRef}
        className="w-full min-h-[44px] flex items-center justify-center [&>div]:w-full [&>div>iframe]:!w-full"
      />

      {/* Fallback button if Google script is loading or blocked by ad-blocker */}
      {(!scriptLoaded || loading) && (
        <button
          type="button"
          onClick={handleCustomButtonClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-[#E3E8DF] bg-white hover:bg-[#F1F5EE] text-[#252B26] text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#245C3A]" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{label}</span>
        </button>
      )}
    </div>
  );
}
