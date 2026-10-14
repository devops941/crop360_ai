import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Fertilizer & Nutrient Management | Crop360 AI',
  description: 'Precision split-dose fertigation, basal application, foliar nutrition, and ICAR crop response curves',
};

export default function NutrientsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
