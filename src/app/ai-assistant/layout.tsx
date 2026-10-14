import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'AI Agricultural Assistant | Crop360 AI',
  description: 'Multilingual conversational agronomist with ICAR & TNAU intelligence for soil health, pest control, and fertigation',
};

export default function AIAssistantLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
