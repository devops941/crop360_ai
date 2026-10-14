'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FarmerForm } from '@/components/modules/farmer-form';
import { FarmerInput } from '@/validators/farmer.validator';
import { Sprout } from 'lucide-react';
import { toast } from 'react-toastify';

export default function EditFarmerPage() {
  const params = useParams();
  const router = useRouter();
  const farmerId = params.id as string;
  const [initialData, setInitialData] = useState<FarmerInput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFarmer() {
      try {
        const res = await fetch(`/api/farmers/${farmerId}`);
        if (!res.ok) {
          toast.error('Farmer record not found');
          router.push('/farmers');
          return;
        }
        const json = await res.json();
        setInitialData(json.data);
      } catch {
        toast.error('Failed to load farmer record');
        router.push('/farmers');
      } finally {
        setLoading(false);
      }
    }

    if (farmerId) {
      fetchFarmer();
    }
  }, [farmerId, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Sprout className="h-8 w-8 text-[#245C3A] dark:text-emerald-400 animate-pulse" />
          <p className="text-xs text-[#687168] dark:text-stone-400">Loading farmer record...</p>
        </div>
      </div>
    );
  }

  if (!initialData) return null;

  return <FarmerForm mode="edit" farmerId={farmerId} initialData={initialData} />;
}
