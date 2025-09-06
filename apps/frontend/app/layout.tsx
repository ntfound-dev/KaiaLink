import { ReactNode } from 'react';

// Root layout ini sekarang hanya shell dasar.
// Semua logika akan ada di dalam app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}