'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DefiRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/defi/swap');
  }, [router]);

  return (
    <div className="flex items-center justify-center p-10">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-gray-500">Mempersiapkan Ruang DeFi...</p>
    </div>
  );
}