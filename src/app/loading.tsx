import React from 'react';
import { Sprout } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-800 animate-pulse border border-forest-200">
          <Sprout className="h-6 w-6 animate-bounce" />
        </div>
        <p className="text-sm font-medium text-charcoal-600">Loading Crop360 AI...</p>
      </div>
    </div>
  );
}
