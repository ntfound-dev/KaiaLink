'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Crown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import styles from '@/styles/leaderboard.module.css';
import type { GenericLeaderboardEntry } from '@/types/shared';

type LeaderboardCategory = 'points' | 'swap' | 'amm' | 'lending' | 'staking' | 'referral';

const leaderboardConfigs: Record<
  LeaderboardCategory,
  { label: string; valueLabel: string; valueFormatter: (v: number) => React.ReactNode }
> = {
  points: { label: 'Poin', valueLabel: 'Total Poin', valueFormatter: (v) => v.toLocaleString() },
  swap: {
    label: 'Volume Swap',
    valueLabel: 'Volume Swap (USD)',
    valueFormatter: (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  amm: {
    label: 'TVL AMM',
    valueLabel: 'TVL AMM (USD)',
    valueFormatter: (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  lending: {
    label: 'TVL Lending',
    valueLabel: 'TVL Lending (USD)',
    valueFormatter: (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  staking: {
    label: 'TVL Staking',
    valueLabel: 'TVL Staking (USD)',
    valueFormatter: (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  referral: { label: 'Referral Terbanyak', valueLabel: 'Jumlah Referral', valueFormatter: (v) => v.toLocaleString() },
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('points');
  const qc = useQueryClient();

  // Ambil data dari hook — bisa jadi undefined atau bukan array, jadi kita normalisasi di bawah
  const { data: rawData, isLoading, isError, refetch } = useLeaderboard(activeTab);

  // Normalisasi: pastikan `data` selalu array untuk keperluan render (.length, .map)
  const data: GenericLeaderboardEntry[] = Array.isArray(rawData) ? rawData : [];

  const cfg = leaderboardConfigs[activeTab];

  return (
    <div className={styles.leaderboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.leaderboardHeaderTitle}>Papan Peringkat Global</h1>
          <p className={styles.leaderboardHeaderSubtitle}>Lihat siapa yang teratas di ekosistem KaiaLink.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={() => {
              qc.invalidateQueries({ queryKey: ['leaderboard', activeTab] });
              refetch();
            }}
            aria-label="Refresh leaderboard"
            title="Refresh"
          >
            ⟳
          </button>
        </div>
      </div>

      <div className={styles.leaderboardTabs} role="tablist" aria-label="Kategori leaderboard">
        {(Object.keys(leaderboardConfigs) as LeaderboardCategory[]).map((tabId) => (
          <button
            key={tabId}
            role="tab"
            aria-selected={activeTab === tabId}
            aria-controls={`leaderboard-${tabId}`}
            id={`tab-${tabId}`}
            onClick={() => setActiveTab(tabId)}
            className={`${styles.tabButton} ${activeTab === tabId ? styles.tabButtonActive : ''}`}
          >
            {leaderboardConfigs[tabId].label}
          </button>
        ))}
      </div>

      <Card className={styles.leaderboardCard}>
        <div id={`leaderboard-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          <div className={styles.tableHeader}>
            <div className={styles.colRank}>Peringkat</div>
            <div className={styles.colUser}>Username</div>
            <div className={styles.colValue}>{cfg.valueLabel}</div>
          </div>

          {isLoading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow}>
                  <div className={styles.skelRank} />
                  <div className={styles.skelUser} />
                  <div className={styles.skelValue} />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className={styles.leaderboardError}>
              Gagal memuat data.
              <button className={styles.retryBtn} onClick={() => refetch()}>
                Coba lagi
              </button>
            </div>
          ) : data.length > 0 ? (
            <div className={styles.tableBody}>
              {data.map((item: GenericLeaderboardEntry) => (
                <div key={`${activeTab}-${item.rank}-${item.username}`} className={styles.leaderboardRow}>
                  <div className={styles.colRank}>
                    <span className={styles.rankWrap}>
                      {item.rank}
                      {item.rank === 1 && <Crown className={styles.leaderboardCrown} />}
                    </span>
                  </div>

                  <div className={styles.colUser}>
                    <div className={styles.username}>{item.username}</div>
                    <div className={styles.userMeta}>{item.userId ?? ''}</div>
                  </div>

                  <div className={styles.colValue}>
                    <div className={styles.valueFormatted}>{cfg.valueFormatter(item.value ?? 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.leaderboardEmpty}>Tidak ada data untuk kategori ini.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
