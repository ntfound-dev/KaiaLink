'use client';
import styles from '@/styles/leaderboard.module.css';
import { useState, FC, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GenericLeaderboardEntry } from '@/types/shared';
import { Crown } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const leaderboardConfigs = {
  points: {
    label: 'Poin',
    valueLabel: 'Total Poin',
    queryFn: () => api.getLeaderboard('points'),
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  swap: {
    label: 'Volume Swap',
    valueLabel: 'Volume Swap (USD)',
    queryFn: () => api.getLeaderboard('swap'),
    valueFormatter: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  amm: {
    label: 'TVL AMM',
    valueLabel: 'TVL AMM (USD)',
    queryFn: () => api.getLeaderboard('amm'),
    valueFormatter: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  lending: {
    label: 'TVL Lending',
    valueLabel: 'TVL Lending (USD)',
    queryFn: () => api.getLeaderboard('lending'),
    valueFormatter: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  staking: {
    label: 'TVL Staking',
    valueLabel: 'TVL Staking (USD)',
    queryFn: () => api.getLeaderboard('staking'),
    valueFormatter: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  referral: {
    label: 'Referral Terbanyak',
    valueLabel: 'Jumlah Referral',
    queryFn: () => api.getLeaderboard('referral'),
    valueFormatter: (value: number) => value.toLocaleString(),
  },
} as const;

type LeaderboardCategory = keyof typeof leaderboardConfigs;
type LeaderboardDataItem = GenericLeaderboardEntry;

interface LeaderboardTableProps {
  data: LeaderboardDataItem[];
  valueLabel: string;
  valueFormatter: (value: number) => ReactNode;
  isLoading: boolean;
  isError: boolean;
}

const LeaderboardTable: FC<LeaderboardTableProps> = ({ data, valueLabel, valueFormatter, isLoading, isError }) => {
  if (isLoading) return <p className={styles.leaderboardLoading}>Memuat data peringkat...</p>;
  if (isError) return <p className={styles.leaderboardError}>Gagal memuat data. Silakan coba lagi nanti.</p>;
  if (!data || data.length === 0) return <p className={styles.leaderboardEmpty}>Data tidak tersedia untuk kategori ini.</p>;

  return (
    <table className={styles.leaderboardTable}>
      <thead>
        <tr>
          <th className="p-4 font-semibold">Peringkat</th>
          <th className="p-4 font-semibold">Username</th>
          <th className="p-4 font-semibold text-right">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((user) => (
          <tr key={user.rank} className={styles.leaderboardRow}>
            <td className="p-4">
              <div className={styles.leaderboardRank}>
                {user.rank}
                {user.rank === 1 && <Crown className={styles.leaderboardCrown} />}
              </div>
            </td>
            <td className="p-4">
              <div className={styles.leaderboardUsername}>{user.username}</div>
            </td>
            <td className="p-4">
              <div className={styles.leaderboardValue}>{valueFormatter(user.value ?? 0)}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('points');

  const { data, isLoading, isError } = useQuery<LeaderboardDataItem[], unknown>({
    queryKey: ['leaderboard', activeTab],
    queryFn: () => leaderboardConfigs[activeTab].queryFn(),
    // optional: staleTime: 1000 * 30,
  });

  const activeConfig = leaderboardConfigs[activeTab];

  return (
    <div className={`${styles.leaderboardContainer} space-y-8`}>
      <div>
        <h1 className={styles.leaderboardHeaderTitle}>Papan Peringkat Global</h1>
        <p className={styles.leaderboardHeaderSubtitle}>Lihat siapa yang teratas di ekosistem KaiaLink.</p>
      </div>

      <div className={styles.leaderboardTabs}>
        {(Object.keys(leaderboardConfigs) as LeaderboardCategory[]).map((tabId) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            aria-selected={activeTab === tabId}
            className={`${styles.tabButton} ${activeTab === tabId ? styles.tabButtonActive : ''}`}
          >
            {leaderboardConfigs[tabId].label}
          </button>
        ))}
      </div>

      <Card className={`${styles.leaderboardCard} overflow-hidden`}>
        <LeaderboardTable
          data={data || []}
          isLoading={isLoading}
          isError={isError}
          valueLabel={activeConfig.valueLabel}
          valueFormatter={activeConfig.valueFormatter}
        />
      </Card>
    </div>
  );
}
