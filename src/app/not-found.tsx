import React from 'react';
import Link from 'next/link';
import { Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 min-h-[60vh]">
      <div className="max-w-md w-full rounded-2xl border border-charcoal-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 text-forest-800 mb-4">
          <Compass className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900 mb-2">404 - Page Not Found</h2>
        <p className="text-sm text-charcoal-600 mb-6">
          The agricultural resource or page you are looking for does not exist or has been
          relocated.
        </p>
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="primary">
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
