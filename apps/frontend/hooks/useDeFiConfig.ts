// apps/frontend/hooks/useDeFiConfig.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import apiDefault from '@/lib/api';
import type { DeFiConfig } from '@/types/shared';

export function useDeFiConfig() {
  return useQuery<DeFiConfig | undefined, Error>({
    queryKey: ['defiConfig'],
    queryFn: async () => {
      // Prefer central api export if it provides getDeFiConfig
      try {
        if (apiDefault && typeof (apiDefault as any).getDeFiConfig === 'function') {
          return (await (apiDefault as any).getDeFiConfig()) as DeFiConfig;
        }

        // fallback: try typedApi from real implementation
        const maybe = await import('@/lib/api/real');
        if (maybe && typeof maybe.typedApi?.getDeFiConfig === 'function') {
          return (await maybe.typedApi.getDeFiConfig()) as DeFiConfig;
        }

        // last fallback: try apiDefault.typedApi
        if ((apiDefault as any).typedApi && typeof (apiDefault as any).typedApi.getDeFiConfig === 'function') {
          return (await (apiDefault as any).typedApi.getDeFiConfig()) as DeFiConfig;
        }

        return undefined;
      } catch (err) {
        throw err as Error;
      }
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
