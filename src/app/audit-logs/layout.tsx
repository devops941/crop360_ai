import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function AuditLogsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
