import axios from 'axios';
import type { UserProfile, Mission } from '@/types/shared';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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

// Fungsi-fungsi yang sudah ada
export const getUserProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get('/me');
  return data;
};

export const getMissions = async (): Promise<Mission[]> => {
  const { data } = await apiClient.get('/missions');
  return data;
};

export const verifyMission = async (missionId: string): Promise<{ success: boolean }> => {
  const { data } = await apiClient.post(`/missions/${missionId}/verify`);
  return data;
};

// --- FUNGSI BARU UNTUK HALAMAN LAIN ---

export const getPortfolio = async (): Promise<any> => {
  const { data } = await apiClient.get('/defi/portfolio');
  return data;
};

export const getLeaderboard = async (): Promise<any[]> => {
  const { data } = await apiClient.get('/leaderboards/points');
  return data;
};

export const getReferralData = async (): Promise<any> => {
  const { data } = await apiClient.get('/referrals');
  return data;
};

export const getAirdropData = async (): Promise<any> => {
  const { data } = await apiClient.get('/airdrop');
  return data;
};

export const sendChatMessage = async (text: string): Promise<string> => {
  const { data } = await apiClient.post('/ai/chat', { message: text });
  return data.reply;
};
