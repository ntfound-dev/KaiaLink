'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Daftar link untuk navigasi tab DeFi
const defiLinks = [
  { href: '/defi/swap', label: 'Swap' },
  { href: '/defi/amm', label: 'Likuiditas' },
  { href: '/defi/lending', label: 'Lending' },
  { href: '/defi/staking', label: 'Staking' },
];

export default function DefiLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Jelajahi DeFi</h1>
        <p className="text-gray-500 mt-1">Semua fitur on-chain untuk mengembangkan aset Anda ada di sini.</p>
      </div>

      {/* --- Navigasi Tab --- */}
      <div className="flex border-b border-gray-200">
        {defiLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-6 py-3 text-lg font-semibold ${pathname.startsWith(link.href) ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Konten dari sub-halaman (swap, amm, dll.) akan dirender di sini */}
      <div>{children}</div>
    </div>
  );
}