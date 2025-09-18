// apps/frontend/app/[locale]/(dapp)/defi/lending/page.tsx
'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import LendingMarketPanel from '@/components/defi/LendingMarketPanel';
import type { DeFiConfig, Market } from '@/types/shared';

export default function LendingPage(): JSX.Element {
  const { data: defiConfig, isLoading, error } = useQuery<DeFiConfig>({
    queryKey: ['defiConfig'],
    queryFn: async () => {
      if (!api || typeof api.getAirdropData !== 'function') {
        return undefined;
      }
      return await api.getAirdropData();
    },
    enabled: !!api && typeof api.getAirdropData === 'function',
  });
  if (isLoading) return <p>Memuat market...</p>;
  if (error) return <p>Gagal memuat market: {(error as Error)?.message ?? 'Unknown error'}</p>;

  const markets: Market[] = defiConfig?.markets ?? [];

  // Map ke shape yang komponen harapkan
  const mapped = markets.map((m) => ({
    asset: m.asset ?? m.symbol ?? m.id,
    supplyApy: typeof m.supplyApy === 'number' ? m.supplyApy : Number(m.supplyApy ?? 0),
    borrowApy: typeof m.borrowApy === 'number' ? m.borrowApy : Number(m.borrowApy ?? 0),
    // bila LendingMarketPanel butuh fields tambahan, tambahkan di sini
  }));

  return (
    <div className="mt-4 space-y-6">
      {mapped.map((market) => (
        <LendingMarketPanel key={market.asset} market={market} />
      ))}
    </div>
  );
}
