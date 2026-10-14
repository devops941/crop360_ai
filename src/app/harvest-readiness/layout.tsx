import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Harvest Readiness Prediction | Crop360 AI',
  description: 'GDD heat unit accumulation, grain moisture levels, visual husk maturity, and 3-day optimal harvest window forecasting',
};

export default function HarvestReadinessLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
