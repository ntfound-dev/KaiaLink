'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Halaman ini berfungsi sebagai titik masuk ke Hub DeFi.
 * Tugas utamanya adalah mengarahkan pengguna ke halaman default (Swap).
 */
export default function DefiRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Arahkan pengguna ke halaman Swap sebagai default
    router.replace('/defi/swap');
  }, [router]);

  return (
    <div className="flex items-center justify-center p-10">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-gray-500">Mengarahkan ke halaman Swap...</p>
    </div>
  );
}
