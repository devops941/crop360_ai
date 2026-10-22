import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Seed Catalog & Variety Feed | Crop360 AI',
  description: 'Manage, feed, and configure certified seed varieties, breeders, seed dosage rates, and biological primers',
};

export default function SeedCatalogLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
