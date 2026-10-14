import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'AI Crop Lifecycle Planning | Crop360 AI',
  description: 'Automated end-to-end master dynamic roadmap synthesizing soil, crop phenology, irrigation, and harvest milestones',
};

export default function LifecyclePlanLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
