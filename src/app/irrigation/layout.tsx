import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Irrigation & Water Budget Management | Crop360 AI',
  description: 'ETc evapotranspiration scheduling, soil moisture tracking, pump run-time calculator, and water conservation',
};

export default function IrrigationLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
