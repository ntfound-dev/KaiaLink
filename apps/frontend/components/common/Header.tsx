'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnector from './WalletConnector';
import { LanguageSwitcher } from './LanguageSwitcher'; // Impor komponen bahasa

// Navigasi baru sesuai struktur halaman
const navLinks = [
  { href: '/home', label: 'Beranda' },
  { href: '/missions', label: 'Misi' },
  { href: '/defi', label: 'DeFi' },
  { href: '/leaderboard', label: 'Peringkat' },
  { href: '/profile', label: 'Profil' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/home" className="text-2xl font-bold text-blue-600">
          KaiaLink
        </Link>

        <ul className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className={`font-semibold transition-colors ${pathname.startsWith(link.href) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <WalletConnector />
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}