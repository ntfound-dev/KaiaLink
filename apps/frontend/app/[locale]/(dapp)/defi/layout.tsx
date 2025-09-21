'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import styles from '@/styles/defi.module.css';

// Daftar link untuk navigasi tab DeFi
const defiLinks = [
  { href: '/defi/swap', label: 'Swap' },
  { href: '/defi/amm', label: 'Likuiditas' },
  { href: '/defi/lending', label: 'Lending' },
  { href: '/defi/staking', label: 'Staking' },
];

export default function DefiLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';

  return (
    <div className={styles.defiRoot}>
      <div className={styles.defiHeader}>
        <h1 className={styles.defiTitle}>Jelajahi DeFi</h1>
        <p className={styles.defiSubtitle}>Semua fitur on-chain untuk mengembangkan aset Anda ada di sini.</p>
      </div>

      {/* --- Navigasi Tab --- */}
      <nav className={styles.defiTabs} role="tablist" aria-label="DeFi tabs">
        {defiLinks.map(link => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.defiTab} ${isActive ? styles.defiTabActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Konten dari sub-halaman (swap, amm, dll.) akan dirender di sini */}
      <div className={styles.defiContent}>{children}</div>
    </div>
  );
}
