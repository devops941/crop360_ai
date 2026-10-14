import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Market Price Analysis (Agmarknet & eNAM) | Crop360 AI',
  description: 'Real-time APMC mandi spot prices, Minimum Support Price (MSP) benchmarks, and market trend forecasts',
};

export default function MarketPricesLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
