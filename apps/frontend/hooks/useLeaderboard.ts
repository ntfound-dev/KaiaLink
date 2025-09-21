// apps/frontend/hooks/useLeaderboard.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/real';
import type { GenericLeaderboardEntry } from '@/types/shared';

/**
 * useLeaderboard
 * - `type` umum berupa string (mis. 'points' | 'swap' | 'amm' | ...)
 * - Hook ini menormalkan respons dari api.getLeaderboard sehingga selalu mengembalikan GenericLeaderboardEntry[]
 */
export function useLeaderboard(type: string) {
  return useQuery<GenericLeaderboardEntry[], Error>({
    queryKey: ['leaderboard', type],
    queryFn: async () => {
      // Ambil response secara defensif — kita tidak tahu shape pasti yang dikembalikan backend (array atau { data: [] })
      const raw: unknown = await (api as any).getLeaderboard(type);

      // Normalisasi ke array
      let arr: any[] = [];
      if (Array.isArray(raw)) {
        arr = raw;
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
        arr = (raw as any).data;
      } else if (raw && typeof raw === 'object') {
        // kadang backend mengembalikan object dengan keys numeric / hasil single object
        // kita coba cari property yang kira-kira berisi daftar
        const possible = Object.values(raw as Record<string, any>).find((v) => Array.isArray(v));
        if (Array.isArray(possible)) arr = possible as any[];
      } else {
        arr = [];
      }

      // Map ke GenericLeaderboardEntry (defensive)
      const mapped = (arr || []).map((d: any, idx: number) => ({
        rank: d?.rank ?? idx + 1,
        username: d?.username ?? d?.name ?? d?.handle ?? '—',
        value: typeof d?.value === 'number' ? d.value : Number(d?.value ?? 0),
        userId: d?.userId ?? d?.id ?? undefined,
        avatarUrl: d?.avatarUrl ?? d?.avatar ?? undefined,
      })) as GenericLeaderboardEntry[];

      return mapped;
    },
    staleTime: 30_000,
    retry: 1,
  });
}
