import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Transportation & Logistics | Crop360 AI',
  description: 'Farm-to-mandi freight booking, truck and tractor-trailer dispatches, driver trip sheets, and GPS transit updates',
};

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
