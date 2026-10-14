import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Storage & Inventory Management | Crop360 AI',
  description: 'Farm godown and CWC warehouse silo tracking, electronic Negotiable Warehouse Receipts (eNWR), and fumigation schedules',
};

export default function InventoryStorageLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
