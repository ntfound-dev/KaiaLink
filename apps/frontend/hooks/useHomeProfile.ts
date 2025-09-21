'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Profile } from '@/types/shared';

export function useHomeProfile() {
  return useQuery<Profile, Error>({
    queryKey: ['myProfile', 'summary'],
    queryFn: async () => {
      // defensif: gunakan api.getMyProfile jika tersedia, fallback ke real export
      if (api && typeof (api as any).getMyProfile === 'function') {
        return (api as any).getMyProfile() as Promise<Profile>;
      }
      // try importing real.ts if index doesn't re-export
      try {
        const real = (await import('@/lib/api/real')).api as any;
        if (real && typeof real.getMyProfile === 'function') return real.getMyProfile() as Promise<Profile>;
      } catch {
        // ignore
      }
      throw new Error('getMyProfile not available on api exports');
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
