// apps/frontend/lib/api/real.ts

import axios from 'axios';
import type {
  UserProfile,
  Mission,
  Portfolio,
  GlobalStats,
  LeaderboardUser,
  LeaderboardTvlUser,
  LeaderboardReferralUser,
  ReferralData,
  AirdropData,
} from '@/types/shared'; // Pastikan path ini benar ke file shared.ts Anda

// ============================================================================
// --- KONFIGURASI KLIEN API ---
// ============================================================================

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Contoh: http://localhost:3001/v1
});

// Interceptor untuk menambahkan token JWT secara otomatis ke setiap request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor untuk menangani error dari backend secara terpusat
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Anda bisa menambahkan notifikasi global (seperti toast/snackbar) di sini
    console.error('API Error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      // Logika untuk menangani sesi yang tidak valid (misal: logout otomatis)
      // localStorage.removeItem('jwt_token');
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);


// ============================================================================
// --- IMPLEMENTASI FUNGSI-FUNGSI API ---
// ============================================================================

/** Mengambil profil pengguna yang sedang login. */
export const getUserProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get('/users/profile');
  return data;
};

/** Mengambil daftar semua misi yang tersedia. */
export const getMissions = async (): Promise<Mission[]> => {
  const { data } = await apiClient.get('/missions');
  return data;
};

/** Memverifikasi penyelesaian sebuah misi ke backend. */
export const verifyMission = async (missionId: string): Promise<{ success: boolean }> => {
  const { data } = await apiClient.post(`/missions/${missionId}/verify`);
  return data;
};

/** Mengambil data portofolio DeFi pengguna. */
export const getPortfolio = async (): Promise<Portfolio> => {
  const { data } = await apiClient.get('/defi/portfolio');
  return data;
};

/** Mengambil statistik global platform. */
export const getGlobalStats = async (): Promise<GlobalStats> => {
    const { data } = await apiClient.get('/stats/global');
    return data;
};


// --- Leaderboards ---

/** Mengambil data leaderboard berdasarkan poin. */
export const getLeaderboardPoints = async (): Promise<LeaderboardUser[]> => {
  const { data } = await apiClient.get('/leaderboards/points');
  return data;
};

/** Mengambil data leaderboard berdasarkan TVL. */
export const getLeaderboardTvl = async (): Promise<LeaderboardTvlUser[]> => {
    const { data } = await apiClient.get('/leaderboards/tvl');
    return data;
};

/** Mengambil data leaderboard berdasarkan jumlah referral. */
export const getLeaderboardReferrals = async (): Promise<LeaderboardReferralUser[]> => {
    const { data } = await apiClient.get('/leaderboards/referrals');
    return data;
};


// --- Fitur Lain ---

/** Mengambil data referral pengguna. */
export const getReferralData = async (): Promise<ReferralData> => {
  const { data } = await apiClient.get('/referrals');
  return data;
};

/** Mengambil data status airdrop pengguna. */
export const getAirdropData = async (): Promise<AirdropData> => {
  const { data } = await apiClient.get('/airdrop/status');
  return data;
};