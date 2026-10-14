'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Map, Plus, Edit, Trash2, Droplet, Layers, User, ArrowRight } from 'lucide-react';
import { DataTable, Column } from '@/components/common/data-table';
import { toast } from 'react-toastify';

interface FarmRow extends Record<string, unknown> {
  _id: string;
  surveyNumber: string;
  parcelName: string;
  totalAreaAcres: number;
  cultivableAreaAcres: number;
  soilType: string;
  irrigationSource: string;
  district: string;
  farmerId: {
    _id: string;
    name: string;
    farmerCode: string;
    phone: string;
  };
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFarms = async () => {
    try {
      const res = await fetch('/api/farms');
      if (res.ok) {
        const json = await res.json();
        setFarms(json.data || []);
      }
    } catch {
      toast.error('Failed to load farm parcels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(`Delete land parcel "${name}"? This action is tracked in the audit trail.`)
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/farms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Land parcel deleted.`);
        fetchFarms();
      } else {
        toast.error('Failed to delete parcel');
      }
    } catch {
      toast.error('Error deleting parcel');
    }
  };

  const columns: Column<FarmRow>[] = [
    {
      key: 'surveyNumber',
      header: 'Survey / Patta No.',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-mono font-bold text-[#245C3A] dark:text-emerald-400 bg-[#E7EFE6] dark:bg-emerald-950/70 px-2 py-0.5 rounded text-[11px]">
            {item.surveyNumber}
          </span>
          <span className="text-xs font-semibold text-[#252B26] dark:text-stone-100 block mt-1">{item.parcelName}</span>
        </div>
      ),
    },
    {
      key: 'farmerName',
      header: 'Farmer Owner',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-[#252B26] dark:text-stone-100 block">
            {item.farmerId?.name || 'Unassigned'}
          </span>
          <span className="text-[11px] font-mono text-[#687168] dark:text-stone-400">{item.farmerId?.farmerCode}</span>
        </div>
      ),
    },
    {
      key: 'acreage',
      header: 'Area (Acres)',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-[#252B26] dark:text-stone-200">
          {item.cultivableAreaAcres} / {item.totalAreaAcres} ac
        </span>
      ),
    },
    {
      key: 'soilType',
      header: 'Soil & Irrigation',
      render: (item) => (
        <div className="space-y-0.5 text-[11px]">
          <span className="flex items-center gap-1 text-[#252B26] dark:text-stone-200 capitalize">
            <Layers className="h-3 w-3 text-[#245C3A] dark:text-emerald-400" /> {item.soilType.replace('_', ' ')}
          </span>
          <span className="flex items-center gap-1 text-[#687168] dark:text-stone-400 capitalize">
            <Droplet className="h-3 w-3 text-blue-600 dark:text-blue-400" /> {item.irrigationSource}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/farms/${item._id}`}
            className="p-1.5 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-[#F1F5EE] dark:hover:bg-stone-700 text-[#252B26] dark:text-stone-200 transition-colors"
            title="Edit Land Parcel"
          >
            <Edit className="h-3.5 w-3.5 text-[#245C3A] dark:text-emerald-400" />
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(item._id, item.parcelName)}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors"
            title="Delete Land Parcel"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8DF] dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E7EFE6] dark:bg-emerald-950/70 text-[#245C3A] dark:text-emerald-400">
              MODULE 2
            </span>
            <span className="text-xs text-[#687168] dark:text-stone-400">• Land Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-[#252B26] dark:text-white tracking-tight">
            Farm &amp; Land Management
          </h1>
          <p className="text-xs text-[#687168] dark:text-[#a0b5a3] mt-0.5">
            Track survey numbers, acreage boundaries, soil classifications, and water resources.
          </p>
        </div>

        <Link
          href="/farms/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#2d7348] dark:hover:bg-[#245C3A] text-white shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Land Parcel</span>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Total Land Parcels</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-white mt-1">{farms.length}</p>
        </div>
        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Total Cultivable Area</span>
          <p className="text-2xl font-bold text-[#245C3A] dark:text-emerald-400 mt-1">
            {farms.reduce((acc, f) => acc + (Number(f.cultivableAreaAcres) || 0), 0).toFixed(1)}{' '}
            Acres
          </p>
        </div>
        <div className="rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs transition-colors">
          <span className="text-xs text-[#687168] dark:text-[#9bb19f]">Irrigated Plots</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-white mt-1">
            {farms.filter((f) => f.irrigationSource !== 'rainfed').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={farms}
        columns={columns}
        searchPlaceholder="Search by survey no., plot name, or farmer..."
        searchKey="surveyNumber"
        emptyMessage="No land parcels registered yet. Click 'Add Land Parcel' to link field acreage."
      />
    </div>
  );
}
