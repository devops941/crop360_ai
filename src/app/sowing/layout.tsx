import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Sowing & Planting Management | Crop360 AI',
  description: 'Crop spacing geometry, plant population density tracking, nursery age, and harvest forecasting',
};

export default function SowingLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
