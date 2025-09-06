'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Halaman ini berfungsi sebagai titik masuk default untuk bagian DeFi.
 * Tugasnya hanya satu: mengarahkan pengguna ke halaman swap (/defi/swap)
 * untuk pengalaman pengguna yang lebih lancar.
 */
export default function DefiRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Menggunakan router.replace() agar halaman ini tidak masuk ke dalam riwayat browser.
    // Ini mencegah pengguna menekan tombol "kembali" dan kembali ke halaman redirect ini.
    router.replace('/defi/swap');
  }, [router]);

  // Menampilkan pesan loading yang lebih menarik secara visual
  // sementara proses redirect berlangsung.
  return (
    <div className="flex flex-col items-center justify-center p-24 text-center">
      <svg
        className="animate-spin h-12 w-12 text-blue-500 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <h2 className="text-xl font-semibold text-gray-700">
        Mempersiapkan Ruang DeFi
      </h2>
      <p className="text-gray-500 mt-2">
        Anda akan diarahkan ke halaman Swap...
      </p>
    </div>
  );
}

