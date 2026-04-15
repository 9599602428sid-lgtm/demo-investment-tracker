import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Family Investment Tracker',
  description: 'Family investment portfolio tracker — stocks, mutual funds, FD, bonds & insurance',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
