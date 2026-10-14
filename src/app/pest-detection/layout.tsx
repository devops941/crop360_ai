import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Pest & Disease Detection | Crop360 AI',
  description: 'AI vision and symptom diagnostics for plant pests, fungal blights, viral infections, and ETL threshold alerts',
};

export default function PestDetectionLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
