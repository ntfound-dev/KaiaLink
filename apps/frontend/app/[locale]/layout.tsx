import type { Metadata } from 'next';
import './../../styles/globals.css'; // Path perlu disesuaikan karena pindah folder
import { ClientProviders } from '../client-providers'; // Path perlu disesuaikan
import { I18nProvider } from '@/locales/provider';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'KaiaLink dApp',
  description: 'Onboarding DeFi via LINE',
};

// PERHATIKAN: Layout ini sekarang menerima 'params'
export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    // 'lang' sekarang dinamis dari URL
    <html lang={locale}>
      <body>
        {/* I18nProvider sekarang mendapatkan locale dari params */}
        <I18nProvider locale={locale}>
          <ClientProviders>{children}</ClientProviders>
        </I18nProvider>
      </body>
    </html>
  );
}