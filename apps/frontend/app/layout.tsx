// apps/frontend/app/layout.tsx

import '../styles/globals.css';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const acceptLang = headers().get('accept-language') ?? '';
  const lang = acceptLang.split(',')[0]?.split('-')[0] ?? 'en';

  return (
    <html lang={lang}>
      <head />
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
