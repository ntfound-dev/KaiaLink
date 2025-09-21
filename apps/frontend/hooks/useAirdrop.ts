// apps/frontend/hooks/useAirdrop.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api'; // asumsi index/real export getAirdropData, claimAirdrop

// Local type (kan juga dipindah ke types/shared.ts jika mau)
export type AirdropData = {
  isEligible?: boolean;
  claimableAmount?: number;
  // tambahan metadata jika backend sediakan
  reason?: string;
};

export function useAirdrop() {
  const qc = useQueryClient();

  const query = useQuery<AirdropData | undefined, Error>({
    queryKey: ['airdropData'],
    queryFn: async () => {
      if (!api || typeof (api as any).getAirdropData !== 'function') return undefined;
      return (await (api as any).getAirdropData()) as AirdropData;
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const claimMutation = useMutation<any, Error, void>({
    mutationFn: async () => {
      if (!api || typeof (api as any).claimAirdrop !== 'function') {
        throw new Error('Claim API not implemented');
      }
      return await (api as any).claimAirdrop();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['airdropData'] });
    },
  });

  // Be tolerant terhadap variasi typing/status antara versi react-query:
  // beberapa versi menggunakan 'loading', beberapa 'pending'
  const mutationStatusStr = String(claimMutation.status);
  const isClaiming = ['loading', 'pending'].includes(mutationStatusStr);

  return {
    ...query,
    // pemanggilan sinkron: memicu mutate (callback)
    claim: () => claimMutation.mutate(),
    // pemanggilan asynchronous: mengembalikan Promise
    claimAsync: () => claimMutation.mutateAsync(),
    // gunakan pemeriksaan tolerant di atas
    isClaiming,
    // jika error, kembalikan error; jika tidak, undefined
    claimError: claimMutation.status === 'error' ? claimMutation.error : undefined,
    claimResult: claimMutation.data,
  };
}
