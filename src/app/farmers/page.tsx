'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  FileSpreadsheet,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DataTable, Column } from '@/components/common/data-table';
import { toast } from 'react-toastify';

interface FarmerRow extends Record<string, unknown> {
  _id: string;
  farmerCode: string;
  name: string;
  phone: string;
  category: string;
  district: string;
  state: string;
  status: string;
  createdAt: string;
}

export default function FarmersPage() {
  const router = useRouter();
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFarmers = async () => {
    try {
      const res = await fetch('/api/farmers');
      if (res.ok) {
        const data = await res.json();
        setFarmers(data.data || []);
      }
    } catch {
      toast.error('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete farmer "${name}"? This action is tracked in the audit log.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/farmers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Farmer "${name}" deleted.`);
        fetchFarmers();
      } else {
        toast.error('Failed to delete farmer');
      }
    } catch {
      toast.error('Error deleting farmer');
    }
  };

  const columns: Column<FarmerRow>[] = [
    {
      key: 'farmerCode',
      header: 'Farmer Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-[#245C3A] dark:text-emerald-400 bg-[#E7EFE6] dark:bg-emerald-950/70 px-2 py-0.5 rounded text-[11px]">
          {item.farmerCode}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Farmer Name',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-[#252B26] dark:text-stone-100 block">{item.name}</span>
          <span className="text-[11px] text-[#687168] dark:text-stone-400 flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3" /> {item.phone}
          </span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (item) => (
        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-medium border border-[#E3E8DF] dark:border-stone-700 bg-[#FAFAF6] dark:bg-stone-800 text-[#252B26] dark:text-stone-200">
          {item.category} Farmer
        </span>
      ),
    },
    {
      key: 'district',
      header: 'Location',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-[#252B26] dark:text-stone-200 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-[#245C3A] dark:text-emerald-400" />
          {item.district}, {item.state}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
            item.status === 'active'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/farmers/${item._id}`}
            className="p-1.5 rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-[#F1F5EE] dark:hover:bg-stone-700 text-[#252B26] dark:text-stone-200"
            title="Edit Farmer"
          >
            <Edit className="h-3.5 w-3.5 text-[#245C3A] dark:text-emerald-400" />
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(item._id, item.name)}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400"
            title="Delete Farmer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8DF] dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-[#252B26] dark:text-stone-100 tracking-tight mb-1">Farmer Management</h1>
          <p className="text-xs text-[#687168] dark:text-stone-400">
            Maintain centralized farmer identities, contact directories, and agricultural
            demographics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/farmers/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#193D2A] text-white shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Register Farmer</span>
          </Link>
        </div>
      </div>

      {/* Quick Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E3E8DF] dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs">
          <span className="text-xs text-[#687168] dark:text-stone-400">Total Registered Farmers</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-stone-100 mt-1">{farmers.length}</p>
        </div>
        <div className="rounded-xl border border-[#E3E8DF] dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs">
          <span className="text-xs text-[#687168] dark:text-stone-400">Active Agronomic Profiles</span>
          <p className="text-2xl font-bold text-[#245C3A] dark:text-emerald-400 mt-1">
            {farmers.filter((f) => f.status === 'active').length}
          </p>
        </div>
        <div className="rounded-xl border border-[#E3E8DF] dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs">
          <span className="text-xs text-[#687168] dark:text-stone-400">Districts Covered</span>
          <p className="text-2xl font-bold text-[#252B26] dark:text-stone-100 mt-1">
            {new Set(farmers.map((f) => f.district)).size || 1}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={farmers}
        columns={columns}
        searchPlaceholder="Search by name, phone, code, or district..."
        searchKey="name"
        emptyMessage="No farmers registered yet. Click 'Register Farmer' above to add your first record."
      />
    </div>
  );
}
