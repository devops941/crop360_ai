import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function FarmersLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
