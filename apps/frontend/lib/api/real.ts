// apps/frontend/lib/api/real.ts
import axios from 'axios';
import type {
  Profile,
  Mission,
  ReferralData,
  AirdropData,
  GenericLeaderboardEntry,
} from '@/types/shared';

// ============================================================================
// KONFIGURASI AXIOS CLIENT
// ============================================================================
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        if (!config.headers) config.headers = {} as any;
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// API OBJECT (axios-based)
// ============================================================================
export const api = {
  /** Mengambil profil pengguna yang sedang login. */
  async getUserProfile(): Promise<Profile> {
    const { data } = await apiClient.get('/users/me');
    return data as Profile;
  },

  /** Alias / mapping ke Profile bila perlu. */
  async getMyProfile(): Promise<Profile> {
    const user = await this.getUserProfile();
    return user as unknown as Profile;
  },

  async getMissions(): Promise<Mission[]> {
    const { data } = await apiClient.get('/missions');
    const raw = data?.data ?? data?.missions ?? data;
    if (Array.isArray(raw)) return raw as Mission[];
    return [];
  },

  async verifyMission(missionId: string | number): Promise<any> {
    const { data } = await apiClient.post(`/missions/${missionId}/complete`);
    return data;
  },

  async getLeaderboard(category: string): Promise<GenericLeaderboardEntry[]> {
    const { data } = await apiClient.get(`/leaderboards/${category}`);
    return data as GenericLeaderboardEntry[];
  },

  async getReferralData(): Promise<ReferralData> {
    const { data } = await apiClient.get('/referrals/my-referrals');
    return data as ReferralData;
  },

  async getAirdropData(): Promise<AirdropData> {
    const { data } = await apiClient.get('/airdrop/status');
    return data as AirdropData;
  },

  async sendChatMessage(message: string, history: any[]): Promise<string> {
    const { data } = await apiClient.post('/ai-chat/send', { message, history });
    return data?.response ?? data;
  },

  /** Mengirim permintaan untuk mengklaim airdrop. */
  async claimAirdrop(): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post('/airdrop/claim');
    return data;
  },
};

export const getMyProfile = async (): Promise<Profile> => {
  return api.getMyProfile();
};

export default api;

/* =========================================================================== */
/* DeFi-specific typed helper API                                              */
/* Jika backend punya endpoint /defi/config, typedApi.getDeFiConfig akan memanggilnya.
   Kalau tidak ada, fungsi akan mengembalikan struktur default yang aman.        */
/* =========================================================================== */

/** Minimal shapes — perpanjang sesuai struktur backendmu */
export interface DeFiPool { [k: string]: any }
export interface DeFiMarket { [k: string]: any }
export interface DeFiFarm { [k: string]: any }

export interface DeFiConfig {
  pools: DeFiPool[];
  markets: DeFiMarket[];
  farms: DeFiFarm[];
  routerAddress?: `0x${string}` | string | undefined;
  [k: string]: any;
}

export interface DeFiApi {
  getDeFiConfig(): Promise<DeFiConfig>;
  // tambah method lain kalau perlu
}

/**
 * typedApi: memanggil endpoint /defi/config jika tersedia,
 * dan memetakan hasilnya ke DeFiConfig. Jika request gagal,
 * fungsi akan mengembalikan objek default yang aman.
 */
export const typedApi: DeFiApi = {
  async getDeFiConfig(): Promise<DeFiConfig> {
    try {
      // Coba panggil endpoint yang umum dipakai untuk konfigurasi DeFi
      const res = await apiClient.get('/defi/config');
      const raw = res?.data ?? res;
      const mapped: DeFiConfig = {
        pools: raw?.pools ?? raw?.data?.pools ?? [],
        markets: raw?.markets ?? raw?.data?.markets ?? [],
        farms: raw?.farms ?? raw?.data?.farms ?? [],
        routerAddress: raw?.routerAddress ?? raw?.data?.routerAddress ?? undefined,
        ...raw,
      };
      return mapped;
    } catch (err) {
      // Fallback aman: kembalikan objek kosong terstruktur
      return {
        pools: [],
        markets: [],
        farms: [],
        routerAddress: undefined,
      };
    }
  },
};
