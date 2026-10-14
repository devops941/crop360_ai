'use client';

import React, { useEffect, useState } from 'react';
import { History, Shield, RefreshCw } from 'lucide-react';
import { DataTable, Column } from '@/components/common/data-table';
import { toast } from 'react-toastify';

interface AuditLogRow extends Record<string, unknown> {
  _id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: {
    userName?: string;
    userRole?: string;
  };
  changes?: {
    diff?: string[];
  };
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: Column<AuditLogRow>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-[11px] text-[#687168] dark:text-stone-400">
          {new Date(item.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (item) => {
        const colors: Record<string, string> = {
          CREATE: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          UPDATE: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          DELETE: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          ANALYZE: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
              colors[item.action] || 'bg-gray-50 dark:bg-stone-800 text-gray-800 dark:text-stone-300 border-gray-200 dark:border-stone-700'
            }`}
          >
            {item.action}
          </span>
        );
      },
    },
    {
      key: 'entityType',
      header: 'Domain Entity',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-[#252B26] dark:text-stone-100 block text-xs">{item.entityType}</span>
          <span className="text-[10px] font-mono text-[#687168] dark:text-stone-400 truncate max-w-[120px] block">
            ID: {item.entityId}
          </span>
        </div>
      ),
    },
    {
      key: 'performedBy',
      header: 'Performed By',
      render: (item) => (
        <div>
          <span className="font-semibold text-[#252B26] dark:text-stone-100 block text-xs">
            {item.performedBy?.userName || 'System'}
          </span>
          <span className="text-[10px] uppercase font-mono text-[#245C3A] dark:text-emerald-400">
            {item.performedBy?.userRole || 'Automated'}
          </span>
        </div>
      ),
    },
    {
      key: 'changes',
      header: 'Modified Fields',
      render: (item) => {
        const diff = item.changes?.diff || [];
        if (diff.length === 0) return <span className="text-[#687168] dark:text-stone-400 text-[11px]">—</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {diff.map((field) => (
              <span
                key={field}
                className="px-1.5 py-0.2 rounded bg-[#F1F5EE] dark:bg-stone-800 border border-[#E3E8DF] dark:border-stone-700 font-mono text-[10px] text-[#252B26] dark:text-stone-200"
              >
                {field}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8DF] dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-[#245C3A] dark:text-emerald-400" />
            <span className="text-xs text-[#687168] dark:text-stone-400 font-semibold">
              Governance &amp; Accountability
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#252B26] dark:text-stone-100 tracking-tight">System Audit Trail</h1>
          <p className="text-xs text-[#687168] dark:text-stone-400 mt-0.5">
            Immutable log of all data modifications, additions, deletions, and agronomic operations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#E3E8DF] dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-[#F1F5EE] dark:hover:bg-stone-700 text-[#252B26] dark:text-stone-200 transition-colors shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search audit trail by entity, user, or action..."
        emptyMessage="No audit logs recorded yet."
      />
    </div>
  );
}
