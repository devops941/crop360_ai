import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Seed Selection & Bio-Treatment | Crop360 AI',
  description: 'Certified seed variety matching, seed rate calculators, and biological seed treatment protocols',
};

export default function SeedSelectionLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
