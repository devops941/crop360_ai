import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Cultivation Cost & Profit (P&L Ledger) | Crop360 AI',
  description: 'Full cost of cultivation accounting, input cost breakdowns, gross revenue realization, and net ROI profit metrics',
};

export default function CultivationPnlLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
