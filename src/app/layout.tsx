import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Investment Tracker',
  description: 'Family investment portfolio tracker — stocks, mutual funds, FD, bonds & insurance',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
