import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Crop Growth & Phenology Monitoring | Crop360 AI',
  description: 'Track BBCH vegetative stages, canopy cover %, plant height, tiller counts, and crop health progression',
};

export default function CropGrowthLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
