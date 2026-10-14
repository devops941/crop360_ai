import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Crop Protection Management (IPM) | Crop360 AI',
  description: 'Integrated Pest Management (IPM) protocols, bio-pesticides, CIBRC formulations, dilution rates, and Pre-Harvest Intervals',
};

export default function CropProtectionLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
