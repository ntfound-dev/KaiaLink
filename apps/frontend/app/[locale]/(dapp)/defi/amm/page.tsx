// apps/frontend/app/[locale]/(dapp)/defi/amm/page.tsx
'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { LiquidityPanel } from "@/components/defi/LiquidityPanel";
import type { DeFiConfig, Pool, Address } from '@/types/shared';

export default function AmmPage(): JSX.Element {
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

  if (isLoading) return <p>Memuat daftar pool...</p>;
  if (error) return <p>Gagal memuat pool: {(error as Error)?.message ?? 'Unknown error'}</p>;

  const availablePools: Pool[] = defiConfig?.pools ?? [];

  return (
    <div className="mt-4 space-y-6">
      {availablePools.map((pool: Pool) => {
        // safe cast ke Address dengan fallback (jika data backend belum konsisten)
        const tokenAAddr = (pool.tokenAAddress ?? '') as unknown as Address;
        const tokenBAddr = (pool.tokenBAddress ?? '') as unknown as Address;
        const pairAddr = (pool.pairAddress ?? `${tokenAAddr}-${tokenBAddr}`) as unknown as Address;

        return (
          <LiquidityPanel
            key={pairAddr}
            tokenA={{ symbol: pool.tokenASymbol ?? '', address: tokenAAddr }}
            tokenB={{ symbol: pool.tokenBSymbol ?? '', address: tokenBAddr }}
            pairAddress={pairAddr}
          />
        );
      })}
    </div>
  );
}
