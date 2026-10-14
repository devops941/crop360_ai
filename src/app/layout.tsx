import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/providers/toast-provider';

export const metadata: Metadata = {
  title: 'Crop360 AI — Intelligence for Indian Agriculture',
  description:
    'Better farming starts with better decisions. Understand your soil, choose suitable crops, and plan cultivation with practical, data-informed agricultural guidance.',
  icons: {
    icon: '/icons/logo.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#245C3A',
  width: 'device-width',
  initialScale: 1,
};

import { ThemeProvider } from '@/components/layout/theme-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-[#FAFAF6] dark:bg-[#111813] text-[#252B26] dark:text-[#E8F0E9] antialiased selection:bg-[#E7EFE6] selection:text-[#193D2A]">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
