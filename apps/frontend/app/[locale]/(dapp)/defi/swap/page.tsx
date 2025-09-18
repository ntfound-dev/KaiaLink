'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
// PENTING: pakai typedApi (wrapper) — jangan impor raw api yang bertipe ApiShape
import api from '@/lib/api';
import SwapForm  from '@/components/defi/SwapForm';
import type { DeFiConfig, Address } from '@/types/shared';

export default function SwapPage(): JSX.Element {
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

  if (isLoading) return <p>Memuat swap...</p>;
  if (error) return <p>Gagal memuat swap: {(error as Error)?.message ?? 'Unknown error'}</p>;

  // routerAddress bertipe Address atau empty string
  const routerAddress: Address | '' = (defiConfig?.routerAddress ?? '') as Address | '';

  // contoh opsi untuk hooks; sementara cast ke any supaya TS tidak complain
  const readOptions = {
    enabled: !!routerAddress,
    onSuccess: (res: any) => {
      // ...
    },
  } as any;

  // contoh unit (hindari bigint literal)
  const oneUnit = BigInt('1000000000000000000');

  return (
    <div>
      <SwapForm
        routerAddress={routerAddress}
        readOptions={readOptions}
        oneUnit={oneUnit}
      />
    </div>
  );
}
