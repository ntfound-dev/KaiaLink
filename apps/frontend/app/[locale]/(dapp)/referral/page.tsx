'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Copy, Users, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import styles from '@/styles/referral.css';

// Tipe lokal untuk data referral — sesuaikan jika api meng-export tipe yang berbeda
type ReferralData = {
  referralCode?: string | null;
  totalReferrals?: number;
  totalBonusPoints?: number;
  referrals?: Array<{ username?: string; status?: string; joinDate?: string }>;
};

export default function ReferralPage() {
  const { data: referralData, isLoading } = useQuery<ReferralData | undefined>({
    queryKey: ['referralData'],
    queryFn: async () => {
      if (!api || typeof api.getReferralData !== 'function') return undefined;
      return await api.getReferralData();
    },
    enabled: !!api && typeof api.getReferralData === 'function',
  });

  return (
    <div className={`${styles.container} space-y-8`}>
      <div>
        <h1 className={styles.headerTitle}>Program Referral</h1>
        <p className={styles.headerSubtitle}>Ajak teman Anda dan dapatkan bonus poin bersama!</p>
      </div>

      <Card className={`${styles.referralCard} ${styles.cardShadow}`}>
        <CardHeader>
          <CardTitle>Bagikan Kode Unik Anda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">Salin dan bagikan kode ini kepada teman Anda.</p>
          <div className={styles.codeRow}>
            <span className={styles.codeText}>{isLoading ? 'Memuat...' : referralData?.referralCode ?? '-'}</span>
            <button
              onClick={() => {
                const code = referralData?.referralCode ?? '';
                if (!code) return;
                if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(code);
                } else {
                  void Promise.resolve();
                }
              }}
              className={styles.copyButton}
              title="Salin Kode"
              disabled={isLoading || !referralData?.referralCode}
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      <div className={styles.metricsGrid}>
        <Card className={styles.metricCard}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Undangan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={styles.metricValue}>{referralData?.totalReferrals ?? 0}</div>
            <p className="text-xs text-muted-foreground">Teman yang telah bergabung</p>
          </CardContent>
        </Card>

        <Card className={styles.metricCard}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonus Poin</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={styles.metricValue}>{referralData?.totalBonusPoints ?? 0}</div>
            <p className="text-xs text-muted-foreground">Poin yang didapat dari referral</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
