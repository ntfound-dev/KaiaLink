'use client';

import { useState, FC, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Crown, DollarSign } from 'lucide-react';
import type { LeaderboardUser, LeaderboardTvlUser, LeaderboardReferralUser } from '@/types/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// Tipe untuk kategori leaderboard
type LeaderboardCategory = 'points' | 'tvl' | 'swap' | 'amm' | 'lending' | 'staking' | 'referral';

// Komponen Tabel yang bisa digunakan kembali
const LeaderboardTable: FC<{ data: any[]; valueLabel: string; valueFormatter: (value: number) => ReactNode; isLoading: boolean }> = ({ data, valueLabel, valueFormatter, isLoading }) => {
    if (isLoading) return <p className="text-center p-8">Memuat data peringkat...</p>;
    if (!data || data.length === 0) return <p className="text-center p-8">Data tidak tersedia untuk kategori ini.</p>;

    return (
        <table className="w-full text-left table-auto">
            <thead>
                <tr className="border-b bg-gray-50">
                    <th className="p-4 font-semibold">Peringkat</th>
                    <th className="p-4 font-semibold">Username</th>
                    <th className="p-4 font-semibold text-right">{valueLabel}</th>
                </tr>
            </thead>
            <tbody>
                {data.map((user, index) => (
                    <tr key={user.rank} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="p-4 font-bold text-lg">
                            {user.rank}
                            {index === 0 && <Crown className="inline w-5 h-5 ml-2 text-yellow-500"/>}
                        </td>
                        <td className="p-4">{user.username}</td>
                        <td className="p-4 text-right font-mono font-semibold">
                            {valueFormatter(user.points || user.value || user.tvl || user.referralCount)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('points');

  // Mengambil data untuk setiap kategori leaderboard
  const { data: pointsData, isLoading: isLoadingPoints } = useQuery({ queryKey: ['leaderboard', 'points'], queryFn: api.getLeaderboard, enabled: activeTab === 'points' });
  const { data: tvlData, isLoading: isLoadingTvl } = useQuery({ queryKey: ['leaderboard', 'tvl'], queryFn: api.getLeaderboardTVL, enabled: activeTab === 'tvl' });
  const { data: swapData, isLoading: isLoadingSwap } = useQuery({ queryKey: ['leaderboard', 'swap'], queryFn: api.getLeaderboardSwap, enabled: activeTab === 'swap' });
  const { data: ammData, isLoading: isLoadingAmm } = useQuery({ queryKey: ['leaderboard', 'amm'], queryFn: api.getLeaderboardAmm, enabled: activeTab === 'amm' });
  const { data: lendingData, isLoading: isLoadingLending } = useQuery({ queryKey: ['leaderboard', 'lending'], queryFn: api.getLeaderboardLending, enabled: activeTab === 'lending' });
  const { data: stakingData, isLoading: isLoadingStaking } = useQuery({ queryKey: ['leaderboard', 'staking'], queryFn: api.getLeaderboardStaking, enabled: activeTab === 'staking' });
  const { data: referralData, isLoading: isLoadingReferral } = useQuery({ queryKey: ['leaderboard', 'referral'], queryFn: api.getLeaderboardReferral, enabled: activeTab === 'referral' }); // <-- Pastikan query ini ada dan benar

  // Data untuk Navigasi Tab
  const TABS: { id: LeaderboardCategory, label: string }[] = [
      { id: 'points', label: 'Poin' }, { id: 'tvl', label: 'Total TVL' }, { id: 'swap', label: 'Volume Swap' },
      { id: 'amm', label: 'TVL AMM' }, { id: 'lending', label: 'TVL Lending' }, { id: 'staking', label: 'TVL Staking' },
      { id: 'referral', label: 'Referral Terbanyak' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Papan Peringkat Global</h1>
        <p className="text-gray-500">Lihat siapa yang teratas di ekosistem KaiaLink.</p>
      </div>
      
      {/* ... Kartu Statistik Global ... */}

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-base font-semibold whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
                {tab.label}
            </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
        {activeTab === 'points' && <LeaderboardTable data={pointsData!} valueLabel="Total Poin" valueFormatter={(val) => val.toLocaleString()} isLoading={isLoadingPoints} />}
        {activeTab === 'tvl' && <LeaderboardTable data={tvlData!} valueLabel="Total TVL (USD)" valueFormatter={(val) => `$${val.toLocaleString(undefined, {minimumFractionDigits: 2})}`} isLoading={isLoadingTvl} />}
        {activeTab === 'swap' && <LeaderboardTable data={swapData!} valueLabel="Volume Swap (USD)" valueFormatter={(val) => `$${val.toLocaleString(undefined, {minimumFractionDigits: 2})}`} isLoading={isLoadingSwap} />}
        {activeTab === 'amm' && <LeaderboardTable data={ammData!} valueLabel="TVL AMM (USD)" valueFormatter={(val) => `$${val.toLocaleString(undefined, {minimumFractionDigits: 2})}`} isLoading={isLoadingAmm} />}
        {activeTab === 'lending' && <LeaderboardTable data={lendingData!} valueLabel="TVL Lending (USD)" valueFormatter={(val) => `$${val.toLocaleString(undefined, {minimumFractionDigits: 2})}`} isLoading={isLoadingLending} />}
        {activeTab === 'staking' && <LeaderboardTable data={stakingData!} valueLabel="TVL Staking (USD)" valueFormatter={(val) => `$${val.toLocaleString(undefined, {minimumFractionDigits: 2})}`} isLoading={isLoadingStaking} />}
        {activeTab === 'referral' && <LeaderboardTable data={referralData!} valueLabel="Jumlah Referral" valueFormatter={(val) => val.toLocaleString()} isLoading={isLoadingReferral} />}
      </div>
    </div>
  );
}