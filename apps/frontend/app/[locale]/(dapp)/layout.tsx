// apps/frontend/app/[locale]/(dapp)/layout.tsx
'use client';

import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import AIChat from '@/components/common/AIChat';

/**
 * Layout untuk halaman yang memerlukan autentikasi / area dapp.
 * Jangan render <html> atau <body> di sini.
 */
export default function DappLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
      <Footer />
      <AIChat />
    </div>
  );
}
