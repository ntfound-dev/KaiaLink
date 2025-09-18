// apps/frontend/lib/api/index.ts
import type { GenericLeaderboardEntry, Profile, Mission, ReferralData, AirdropData } from '@/types/shared';

// import kedua implementasi (pastikan file path benar)
import mockApi from './mock';
import realApi from './real';
export * from './real';

/** Definisikan interface shape API yang kamu gunakan di app */
export interface ApiShape {
  getLeaderboard: (category: string) => Promise<GenericLeaderboardEntry[]>;
  getUserProfile?: () => Promise<Profile>;
  getMissions?: () => Promise<Mission[]>;
  getReferralData?: () => Promise<ReferralData>;
  getAirdropData?: () => Promise<AirdropData>;
  // tambahkan method lain yang diperlukan...
}

/** Pilih implementasi: mock atau real.
 * Ganti kondisi sesuai cara kamu memilih (ENV var, feature flag, dll).
 */
const useMock = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_USE_MOCK === 'true' || false);

const selected = useMock ? mockApi : realApi;

/** Cast ke ApiShape supaya TS yakin semua method tersedia (atau minimal getLeaderboard) */
const api = selected as unknown as ApiShape;

export default api;
