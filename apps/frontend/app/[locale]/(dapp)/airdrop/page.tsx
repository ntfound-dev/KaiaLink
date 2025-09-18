'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Gift, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import styles from '@/styles/airdrop.css';

// Tipe data lokal — sesuaikan dengan tipe yang dikembalikan backend
type AirdropData = {
  isEligible?: boolean;
  claimableAmount?: number;
};

export default function AirdropPage() {
  const { data: airdropData, isLoading } = useQuery<AirdropData | undefined>({
    queryKey: ['airdropData'],
    queryFn: async () => {
      if (!api || typeof api.getAirdropData !== 'function') {
        return undefined;
      }
      return await api.getAirdropData();
    },
    enabled: !!api && typeof api.getAirdropData === 'function',
  });

  return (
    <div className={`${styles.container} space-y-8`}>
      <div>
        <h1 className={styles.headerTitle}>Klaim Airdrop LINKA</h1>
        <p className={styles.headerSubtitle}>
          Halaman ini akan aktif setelah Token Generation Event (TGE).
        </p>
      </div>

      <Card className={styles.airdropCard}>
        <CardHeader>
          <CardTitle className="text-center">Status Airdrop Anda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          <Gift className={styles.airdropIcon} />

          {isLoading ? (
            <div className={styles.loaderWrapper}>
              <div className={styles.loader}></div>
              <p>Memeriksa kelayakan...</p>
            </div>
          ) : airdropData?.isEligible ? (
            <>
              <p className={styles.statusEligible}>
                <CheckCircle size={20} /> Selamat! Anda berhak mendapatkan Airdrop.
              </p>
              <p className={styles.claimAmount}>
                {airdropData?.claimableAmount?.toLocaleString() ?? 0} LINKA
              </p>
              <Button
                disabled
                className={`${styles.claimButton} cursor-not-allowed`}
                size="lg"
              >
                Klaim (Belum Aktif)
              </Button>
              <p className={styles.metaText}>
                Klaim akan tersedia setelah TGE berlangsung.
              </p>
            </>
          ) : (
            <p className={styles.statusIneligible}>
              <XCircle size={20} /> Anda belum memenuhi syarat untuk airdrop.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
