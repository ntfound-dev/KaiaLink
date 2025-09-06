'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Halaman ini adalah root dari grup /dapp.
 * Tugasnya adalah mengarahkan pengguna yang sudah login ke halaman utama (/home)
 * untuk memastikan alur navigasi yang benar dan konsisten.
 */
export default function DappRootPage() {
  const router = useRouter();

  useEffect(() => {
    // --- LOGIKA REDIRECT OTOMATIS KE HOME ---
    // Mengarahkan ke '/home' sesuai dengan struktur halaman baru, bukan '/dashboard'.
    router.replace('/home');
  }, [router]);

  // Menampilkan UI loading yang lebih baik selama proses redirect yang singkat.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
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
      <h2 className="text-xl font-semibold text-gray-700">Mempersiapkan Aplikasi</h2>
      <p className="text-gray-500 mt-2">Anda sedang diarahkan...</p>
    </div>
  );
}
