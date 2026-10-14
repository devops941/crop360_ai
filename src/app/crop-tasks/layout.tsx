import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Crop Task & Schedule Management | Crop360 AI',
  description: 'Farm operational task planner, labor allocation, machinery dispatch, and execution tracking',
};

export default function CropTasksLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
