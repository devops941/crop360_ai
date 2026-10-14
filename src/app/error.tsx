'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6 min-h-[60vh]">
      <div className="max-w-md w-full rounded-2xl border border-charcoal-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-charcoal-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-charcoal-600 mb-6">
          An unexpected error occurred while processing your request. Please try again.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} variant="primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
