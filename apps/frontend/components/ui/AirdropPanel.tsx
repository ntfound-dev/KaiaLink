'use client';

import React from 'react';
import { Gift, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { AirdropData } from '@/hooks/useAirdrop';
import styles from '@/styles/airdrop.module.css';

interface AirdropPanelProps {
  data?: AirdropData;
  isLoading?: boolean;
  isClaiming?: boolean;
  onClaim?: () => void;
  claimDisabled?: boolean;
  claimError?: unknown;
}

export default function AirdropPanel({
  data,
  isLoading,
  isClaiming,
  onClaim,
  claimDisabled = false,
  claimError,
}: AirdropPanelProps) {
  return (
    <div className={styles.container}>
      <Card className={styles.airdropCard}>
        <CardHeader>
          <CardTitle className="text-center">Status Airdrop Anda</CardTitle>
        </CardHeader>

        <CardContent className={styles.cardContent}>
          <Gift className={styles.airdropIcon} />

          {isLoading ? (
            <div className={styles.loaderWrapper}>
              <div className={styles.loader} />
              <p>Memeriksa kelayakan...</p>
            </div>
          ) : data?.isEligible ? (
            <>
              <p className={styles.statusEligible}>
                <CheckCircle size={18} /> Selamat! Anda berhak mendapatkan Airdrop.
              </p>

              <p className={styles.claimAmount}>
                {data?.claimableAmount?.toLocaleString() ?? 0} LINKA
              </p>

              <div className="mt-4">
                <Button
                  onClick={onClaim}
                  disabled={claimDisabled || isClaiming}
                  className={`${styles.claimButton} ${claimDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  size="lg"
                >
                  {isClaiming ? 'Memproses klaim...' : claimDisabled ? 'Klaim (Belum Aktif)' : 'Klaim Sekarang'}
                </Button>
              </div>

              <p className={styles.metaText}>
                Klaim akan tersedia sesuai ketentuan token distribution.
              </p>
            </>
          ) : (
            <p className={styles.statusIneligible}>
              <XCircle size={18} /> Anda belum memenuhi syarat untuk airdrop.
              {data?.reason ? <div className={styles.reasonText}>{data.reason}</div> : null}
            </p>
          )}

          {claimError ? (
            <div className={styles.claimError}>Gagal klaim: {(claimError as any)?.message ?? 'Terjadi kesalahan'}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
