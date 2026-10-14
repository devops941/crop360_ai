import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Post-Harvest Conditioning & Quality | Crop360 AI',
  description: 'Moisture reduction to safe storage levels (12-14%), foreign matter cleaning, winnowing, and digital quality certification',
};

export default function PostHarvestLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
