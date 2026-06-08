import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shift Schedule',
  description: 'Staff shift schedule — synced with Google Sheets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
