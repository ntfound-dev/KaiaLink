// apps/frontend/app/[locale]/layout.tsx
import '../../styles/globals.css';
import { Providers } from '@/app/providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'KaiaLink',
  description: 'Your KaiaLink DApp',
};

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Pastikan tidak ada teks/whitespace di luar tag <html>
  return (
    <html lang={locale}>
      <head />
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
