import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Harvest Management | Crop360 AI',
  description: 'Combine harvester field recording, moisture at threshing, bag counts, and FAQ grain grading',
};

export default function HarvestManagementLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
