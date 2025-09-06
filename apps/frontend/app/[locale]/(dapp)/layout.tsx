'use client';

import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { AIChat } from '@/components/common/AIChat';

/**
 * Ini adalah layout untuk semua halaman yang memerlukan login (di dalam grup /dapp).
 * Tugasnya adalah menyediakan struktur halaman yang konsisten (Header, Footer)
 * dan merender komponen global seperti AIChat.
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
      {/* Komponen Chatbot AI akan melayang di atas semua halaman */}
      <AIChat />
    </div>
  );
}
