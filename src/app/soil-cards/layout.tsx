import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Soil Health Cards | Crop360 AI',
  description: 'Official Government ICAR formatted Soil Health Cards with QR verification',
};

export default function SoilCardsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
