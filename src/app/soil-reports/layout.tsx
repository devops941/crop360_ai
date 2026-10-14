import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Soil Test Reports | Crop360 AI',
  description: 'Digital Soil Health Card records and laboratory test uploads',
};

export default function SoilReportsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
