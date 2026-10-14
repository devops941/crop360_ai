import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Buyer & Selling Management | Crop360 AI',
  description: 'Farm-to-buyer marketplace, institutional FPO procurement contracts, escrow payments, and sales invoicing',
};

export default function BuyerSellingLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
