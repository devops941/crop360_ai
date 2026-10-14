'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FarmForm } from '@/components/modules/farm-form';
import { FarmInput } from '@/validators/farm.validator';
import { Sprout } from 'lucide-react';
import { toast } from 'react-toastify';

export default function EditFarmPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string;
  const [initialData, setInitialData] = useState<FarmInput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFarm() {
      try {
        const res = await fetch(`/api/farms/${farmId}`);
        if (!res.ok) {
          toast.error('Farm parcel not found');
          router.push('/farms');
          return;
        }
        const json = await res.json();
        setInitialData(json.data);
      } catch {
        toast.error('Failed to load parcel record');
        router.push('/farms');
      } finally {
        setLoading(false);
      }
    }

    if (farmId) {
      fetchFarm();
    }
  }, [farmId, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Sprout className="h-8 w-8 text-[#245C3A] animate-pulse" />
          <p className="text-xs text-[#687168]">Loading land parcel...</p>
        </div>
      </div>
    );
  }

  if (!initialData) return null;

  return <FarmForm mode="edit" farmId={farmId} initialData={initialData} />;
}
