// apps/frontend/app/[locale]/(dapp)/defi/staking/page.tsx
'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StakingPanel } from '@/components/defi/StakingPanel';
import type { DeFiConfig, Farm } from '@/types/shared';

export default function StakingPage(): JSX.Element {
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

  if (isLoading) return <p>Memuat farm...</p>;
  if (error) return <p>Gagal memuat farm: {(error as Error)?.message ?? 'Unknown error'}</p>;

  const farms: Farm[] = defiConfig?.farms ?? [];

  return (
    <div className="mt-4 space-y-6">
      {farms.map((farm: Farm) => {
        // Banyak StakingPanel menerima prop bernama `pool` atau `data`.
        // Jika komponen-mu menerima `farm`, gunakan farm={farm}.
        // Jika komponen tidak memiliki prop `farm`, kamu perlu menyesuaikan komponen
        // atau mengirim prop sesuai shape yang diharapkan.

        return (
          // coba kirim farm dulu (most likely). Kalau komponen gagal, ubah StakingPanel props.
          <StakingPanel key={farm.id} farm={farm} />
        );
      })}
    </div>
  );
}
