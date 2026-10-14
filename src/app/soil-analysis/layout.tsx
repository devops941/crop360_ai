import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'AI Soil Analysis Engine | Crop360 AI',
  description: 'Agronomic benchmarking, deficiency remediation, and vernacular advisories',
};

export default function SoilAnalysisLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
