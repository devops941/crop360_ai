import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Land Preparation & Tillage | Crop360 AI',
  description: 'Tillage operations, subsoiling schedules, basal manure incorporation, and seedbed readiness scoring',
};

export default function LandPrepLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
