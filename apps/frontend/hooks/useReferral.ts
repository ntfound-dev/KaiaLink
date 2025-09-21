'use client';

import { useQuery } from '@tanstack/react-query';
import apiDefault from '@/lib/api'; // prefer central export; real.ts re-exported or index default
// fallback: if your index doesn't export, apiDefault may already be real (ok)

export type ReferralData = {
  referralCode?: string | null;
  totalReferrals?: number;
  totalBonusPoints?: number;
  referrals?: Array<{ username?: string; status?: string; joinDate?: string }>;
};

export function useReferral() {
  return useQuery<ReferralData | undefined, Error>({
    queryKey: ['referralData'],
    queryFn: async () => {
      // defensive: check function exists
      if (!apiDefault || typeof (apiDefault as any).getReferralData !== 'function') {
        // try named export style (if you use real.ts default export as `api`)
        const maybeReal = (await import('@/lib/api/real')).api as any;
        if (maybeReal && typeof maybeReal.getReferralData === 'function') {
          return (await maybeReal.getReferralData()) as ReferralData;
        }
        return undefined;
      }
      return (await (apiDefault as any).getReferralData()) as ReferralData;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
