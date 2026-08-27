import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Firm Automations',
  description: 'Internal automation dashboard',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Firm Automations'
  }
};

export const viewport: Viewport = {
  themeColor: '#0f172a'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
