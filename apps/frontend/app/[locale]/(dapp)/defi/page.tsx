'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/defiRoot.module.css';

export default function DefiRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/defi/swap');
  }, [router]);

  return (
    <div className={styles.rootContainer}>
      <div className={styles.spinner}></div>
      <p className={styles.loadingText}>Mempersiapkan Ruang DeFi...</p>
    </div>
  );
}
