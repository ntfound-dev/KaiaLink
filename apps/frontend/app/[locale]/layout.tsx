// apps/frontend/app/[locale]/layout.tsx

import '../../styles/globals.css';
import Providers from '@/app/providers'; // <-- default import

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    // gunakan wrapper biasa; root sudah mengatur <html> & <body>
    <div data-locale={locale}>
      <Providers>{children}</Providers>
    </div>
  );
}
