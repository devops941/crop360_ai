'use client';

import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppHealthData, DbHealthData } from '@/types';

interface HealthState {
  app: AppHealthData | null;
  db: DbHealthData | null;
  loading: boolean;
  error: string | null;
  lastChecked: string | null;
}

export function StatusIndicator() {
  const [state, setState] = useState<HealthState>({
    app: null,
    db: null,
    loading: true,
    error: null,
    lastChecked: null,
  });

  const checkHealth = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [appRes, dbRes] = await Promise.all([fetch('/api/health'), fetch('/api/health/db')]);

      const appData = await appRes.json();
      const dbData = await dbRes.json();

      setState({
        app: appData.data || null,
        db: dbData.data || (dbData.error?.details as DbHealthData) || null,
        loading: false,
        error: !appRes.ok || !dbRes.ok ? dbData.message || 'Partial connectivity issue' : null,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setState({
        app: null,
        db: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to reach API endpoints',
        lastChecked: new Date().toLocaleTimeString(),
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const isAppHealthy = state.app?.status === 'ok';
  const isDbHealthy = state.db?.status === 'connected';

  return (
    <div className="w-full rounded-xl border border-[#E3E8DF] bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="bg-[#FAFAF6] border-b border-[#E3E8DF] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[#252B26]">
            System &amp; Database Connectivity
          </h4>
          <p className="text-xs text-[#687168]">
            Live verification of Next.js Route Handlers and MongoDB Atlas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {state.lastChecked && (
            <span className="text-xs text-[#687168]">Checked: {state.lastChecked}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            isLoading={state.loading}
            className="text-xs border-[#E3E8DF] hover:bg-[#F1F5EE] text-[#252B26]"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* App Health Card */}
          <div className="rounded-lg border border-[#E3E8DF] p-4 bg-[#FAFAF6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[#245C3A]" />
                <span className="text-xs font-semibold text-[#252B26]">Application Server</span>
              </div>
              <Badge variant={isAppHealthy ? 'forest' : 'error'}>
                {isAppHealthy ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Online
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" /> Degraded
                  </>
                )}
              </Badge>
            </div>
            <div className="space-y-1.5 text-xs text-[#687168]">
              <div className="flex justify-between py-1 border-b border-[#E3E8DF]">
                <span>Environment</span>
                <span className="font-mono text-[#252B26] font-medium">
                  {state.app?.environment || '...'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E8DF]">
                <span>Service Version</span>
                <span className="font-mono text-[#252B26] font-medium">
                  v{state.app?.version || '0.1.0'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Endpoint</span>
                <code className="text-[#245C3A] font-medium bg-[#E7EFE6] px-1.5 py-0.5 rounded border border-[#CFDEC9]">
                  GET /api/health
                </code>
              </div>
            </div>
          </div>

          {/* Database Health Card */}
          <div className="rounded-lg border border-[#E3E8DF] p-4 bg-[#FAFAF6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[#245C3A]" />
                <span className="text-xs font-semibold text-[#252B26]">MongoDB Atlas</span>
              </div>
              <Badge variant={isDbHealthy ? 'forest' : 'error'}>
                {isDbHealthy ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" /> Disconnected
                  </>
                )}
              </Badge>
            </div>
            <div className="space-y-1.5 text-xs text-[#687168]">
              <div className="flex justify-between py-1 border-b border-[#E3E8DF]">
                <span>Database</span>
                <span className="font-mono text-[#252B26] font-medium">
                  {state.db?.database || 'agri'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E8DF]">
                <span>Ping Latency</span>
                <span className="font-mono text-[#252B26] font-medium">
                  {state.db?.latencyMs !== undefined ? `${state.db.latencyMs} ms` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Endpoint</span>
                <code className="text-[#245C3A] font-medium bg-[#E7EFE6] px-1.5 py-0.5 rounded border border-[#CFDEC9]">
                  GET /api/health/db
                </code>
              </div>
            </div>
          </div>
        </div>

        {state.error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <strong>Connectivity Notice:</strong> {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
