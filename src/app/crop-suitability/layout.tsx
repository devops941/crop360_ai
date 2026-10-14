import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Crop Suitability & Recommendation | Crop360 AI',
  description: 'AI-driven crop selection based on soil chemistry, seasonal window, and APMC market returns',
};

export default function CropSuitabilityLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
