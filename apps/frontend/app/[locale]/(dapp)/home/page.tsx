'use client';

import React from 'react';
import Link from 'next/link';
import { useHomeProfile } from '@/hooks/useHomeProfile';
import HomeStats from '@/components/ui/HomeStats';
import styles from '@/styles/home.module.css';

export default function HomePage(): JSX.Element {
  const { data: profileData, isLoading, isError } = useHomeProfile();

  if (isLoading) return <div className="p-10 text-center">Memuat data...</div>;
  if (isError) return <div className="p-10 text-center text-red-500">Gagal memuat data.</div>;

  const displayName = profileData?.username ?? 'Pengguna';

  return (
    <div className={styles.root}>
      <div>
        <h1 className={styles.title}>Selamat Datang, {displayName}!</h1>
        <p className={styles.subtitle}>Ini adalah ringkasan progres Anda di KaiaLink.</p>
      </div>

      <HomeStats profile={profileData} />

      <div className={styles.ctaGrid}>
        <div className={styles.ctaCard}>
          <Link href="/missions" className={styles.ctaButton}>Ke Misi</Link>
        </div>
        <div className={styles.ctaCard}>
          <Link href="/defi" className={styles.ctaButton}>Ke DeFi</Link>
        </div>
      </div>
    </div>
  );
}
