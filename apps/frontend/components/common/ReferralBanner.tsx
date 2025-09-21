'use client';

import React, { useMemo } from 'react';
import { useAutoReferral } from '@/hooks/useAutoReferral';
import ReferralShare from './ReferralShare';
import styles from '@/styles/referral.module.css';

/**
 * Small banner that shows when a referral code is detected via cookie/query.
 * - shows code
 * - offers "Use / Apply" (if user logged in will try auto-apply; otherwise save cookie)
 * - dismiss button
 */
export default function ReferralBanner() {
  const { detectedCode, apply, dismiss, applying, applied, error } = useAutoReferral();

  const display = useMemo(() => {
    if (!detectedCode) return null;
    return (
      <div className={styles.bannerWrap} role="region" aria-live="polite">
        <div className={styles.bannerLeft}>
          <div className={styles.bannerTitle}>Kode referral terdeteksi</div>
          <div className={styles.bannerCode}>{detectedCode}</div>
          {error && <div className={styles.bannerError}>Gagal menerapkan kode: {(error as any)?.message ?? 'Error'}</div>}
        </div>

        <div className={styles.bannerActions}>
          {applied ? (
            <button className={styles.bannerApplied} disabled>Terpakai ✓</button>
          ) : (
            <button
              onClick={() => apply()}
              className={styles.bannerApply}
              disabled={applying}
              aria-disabled={applying}
            >
              {applying ? 'Memproses…' : 'Gunakan'}
            </button>
          )}

          <ReferralShare code={detectedCode} />

          <button className={styles.bannerDismiss} onClick={() => dismiss()} aria-label="Tutup">
            ✕
          </button>
        </div>
      </div>
    );
  }, [detectedCode, apply, dismiss, applying, applied, error]);

  return display;
}
