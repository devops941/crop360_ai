import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Weather & Climate Monitoring | Crop360 AI',
  description: 'Hyper-local 7-day IMD Agromet forecasts, Growing Degree Days (GDD), spray suitability windows, and extreme rain advisories',
};

export default function WeatherLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
