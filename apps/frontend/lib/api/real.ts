import axios from 'axios';
import type { UserProfile, Mission, Portfolio, LeaderboardUser, LeaderboardTvlUser, ReferralData, AirdropData } from '@/types/shared';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g., http://localhost:3001/v1
});

// Interceptor untuk menambahkan JWT ke setiap request secara otomatis
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ============================================================================
// --- IMPLEMENTASI FUNGSI API ASLI ---
// ============================================================================

/** Mengambil profil pengguna yang sedang login dari backend. */
export const getUserProfile = async (): Promise<UserProfile> => {
  console.log('%c[MODE ASLI] Mengambil profil pengguna...', 'color: #00CC55');
  const { data } = await apiClient.get('/me');
  return data;
};

/** Mengambil daftar semua misi yang tersedia dari backend. */
export const getMissions = async (): Promise<Mission[]> => {
  console.log('%c[MODE ASLI] Mengambil misi...', 'color: #00CC55');
  const { data } = await apiClient.get('/missions');
  return data;
};

/** Memverifikasi penyelesaian sebuah misi ke backend. */
export const verifyMission = async (missionId: string): Promise<{ success: boolean }> => {
  console.log(`%c[MODE ASLI] Verifikasi misi ${missionId}...`, 'color: #00CC55');
  const { data } = await apiClient.post(`/missions/${missionId}/verify`);
  return data;
};

/** Mengambil data portofolio DeFi pengguna dari backend. */
export const getPortfolio = async (): Promise<Portfolio> => {
  console.log('%c[MODE ASLI] Mengambil portofolio...', 'color: #00CC55');
  const { data } = await apiClient.get('/defi/portfolio');
  return data;
};

// --- Leaderboards ---
/** Mengambil data leaderboard berdasarkan poin. */
export const getLeaderboard = async (): Promise<LeaderboardUser[]> => {
  console.log('%c[MODE ASLI] Mengambil leaderboard poin...', 'color: #00CC55');
  const { data } = await apiClient.get('/leaderboards/points');
  return data;
};

/** Mengambil data leaderboard berdasarkan Total TVL. */
export const getLeaderboardTVL = async (): Promise<LeaderboardTvlUser[]> => {
  console.log('%c[MODE ASLI] Mengambil leaderboard TVL...', 'color: #00CC55');
  const { data } = await apiClient.get('/leaderboards/tvl/total');
  return data;
};

/** Mengambil data leaderboard berdasarkan Volume Swap. */
export const getLeaderboardSwap = async (): Promise<LeaderboardTvlUser[]> => {
  console.log('%c[MODE ASLI] Mengambil leaderboard Swap...', 'color: #00CC55');
  const { data } = await apiClient.get('/leaderboards/tvl/swap');
  return data;
};

/** Mengambil data leaderboard berdasarkan TVL AMM. */
export const getLeaderboardAmm = async (): Promise<LeaderboardTvlUser[]> => {
    console.log('%c[MODE ASLI] Mengambil leaderboard AMM...', 'color: #00CC55');
    const { data } = await apiClient.get('/leaderboards/tvl/amm');
    return data;
};

/** Mengambil data leaderboard berdasarkan TVL Lending. */
export const getLeaderboardLending = async (): Promise<LeaderboardTvlUser[]> => {
    console.log('%c[MODE ASLI] Mengambil leaderboard Lending...', 'color: #00CC55');
    const { data } = await apiClient.get('/leaderboards/tvl/lending');
    return data;
};

/** Mengambil data leaderboard berdasarkan TVL Staking. */
export const getLeaderboardStaking = async (): Promise<LeaderboardTvlUser[]> => {
    console.log('%c[MODE ASLI] Mengambil leaderboard Staking...', 'color: #00CC55');
    const { data } = await apiClient.get('/leaderboards/tvl/staking');
    return data;
};


// --- Fitur Lain ---
/** Mengambil data referral pengguna. */
export const getReferralData = async (): Promise<ReferralData> => {
  console.log('%c[MODE ASLI] Mengambil data referral...', 'color: #00CC55');
  const { data } = await apiClient.get('/referrals');
  return data;
};

/** Mengambil data status airdrop pengguna. */
export const getAirdropData = async (): Promise<AirdropData> => {
  console.log('%c[MODE ASLI] Mengambil data airdrop...', 'color: #00CC55');
  const { data } = await apiClient.get('/airdrop');
  return data;
};

/** Mengirim pesan ke chatbot AI dan mendapatkan balasan. */
export const sendChatMessage = async (text: string): Promise<string> => {
  console.log(`%c[MODE ASLI] Mengirim pesan AI: "${text}"`, 'color: #00CC55');
  const { data } = await apiClient.post('/ai/chat', { message: text });
  return data.reply;
};

