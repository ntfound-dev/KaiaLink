'use client';

import { useMemo } from 'react';
import { useReferral } from '@/hooks/useReferral';
import { Copy, Users, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import styles from '@/styles/referral.module.css';

export default function ReferralPage() {
  const { data: referralData, isLoading } = useReferral();

  const referralCode = useMemo(() => referralData?.referralCode ?? '', [referralData]);

  async function handleCopy() {
    if (!referralCode) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralCode);
        // small feedback — replace with toast if you have one
        alert('Kode referral disalin ke clipboard');
      } else {
        // fallback: create temporary input
        const tmp = document.createElement('input');
        tmp.value = referralCode;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        alert('Kode referral disalin ke clipboard (fallback)');
      }
    } catch (err) {
      console.error('copy failed', err);
      alert('Gagal menyalin kode.');
    }
  }

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
              onClick={handleCopy}
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

      <div>
        <h3 className="text-lg font-semibold">Daftar Referral</h3>
        {referralData?.referrals && referralData.referrals.length > 0 ? (
          <div className={styles.referralsList}>
            {referralData.referrals.map((r, i) => (
              <div key={i} className={styles.referralsRow}>
                <div className={styles.referralUsername}>{r.username ?? '—'}</div>
                <div className={styles.referralMeta}>{r.status ?? '-'}</div>
                <div className={styles.referralMeta}>{r.joinDate ?? '-'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>Belum ada referral.</div>
        )}
      </div>
    </div>
  );
}
