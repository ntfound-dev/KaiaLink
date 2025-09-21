'use client';

import React from 'react';
import { useDeFiConfig } from '@/hooks/useDeFiConfig';
import StakingPanel from '@/components/defi/StakingPanel';
import type { Farm } from '@/components/defi/StakingPanel';

export default function StakingPage() {
  const { data: defiConfig, isLoading, error, refetch } = useDeFiConfig();

  if (isLoading) return <div className="p-6">Memuat staking pools...</div>;
  if (error) return (
    <div className="p-6">
      <div className="text-red-600 mb-4">Gagal memuat konfigurasi: {(error as any)?.message ?? String(error)}</div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => void refetch()}>Coba lagi</button>
    </div>
  );

  // prefer defiConfig.farms or defiConfig.staking or fallback
  const farms: any[] = Array.isArray(defiConfig?.farms) ? defiConfig!.farms : (defiConfig as any)?.staking ?? [];

  if (!farms || farms.length === 0) {
    return <div className="p-6">Belum ada farm/staking pools tersedia.</div>;
  }

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Staking & Farms</h1>
        <p className="text-sm text-gray-500">Stake LP untuk dapatkan reward.</p>
      </header>

      <section className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {farms.map((f: any, i: number) => {
          const farm: Farm = {
            id: f.id ?? f.poolId ?? i,
            rewardToken: f.rewardToken ?? f.reward ?? 'LINKA',
            lpName: f.lpName ?? f.pair ?? f.name ?? `LP-${i}`,
          };
          // Prefer passing poolId + lpToken when available
          const poolId = f.id ?? f.poolId;
          const lpToken = f.lpToken ? { name: f.lpToken.symbol ?? f.lpName, address: f.lpToken.address } : undefined;

          return (
            <StakingPanel key={String(farm.id)} farm={farm} poolId={poolId} lpToken={lpToken} />
          );
        })}
      </section>
    </main>
  );
}
