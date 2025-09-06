// apps/frontend/lib/api/mock.ts
import type { UserProfile, Mission } from '@/types/shared';

// --- MOCK DATABASE (Sumber data palsu) ---
const mockUser: UserProfile = { /* ... data user palsu ... */ };
const mockMissions: Mission[] = [ /* ... data misi palsu ... */ ];
// ... (tambahkan data palsu lainnya jika perlu)

// --- IMPLEMENTASI FUNGSI MOCK ---
export const getUserProfile = async (): Promise<UserProfile> => {
  console.log('%c[MODE SIMULASI] Mengambil profil pengguna...', 'color: #00AACC');
  return new Promise(resolve => setTimeout(() => resolve(mockUser), 500));
};

export const getMissions = async (): Promise<Mission[]> => {
  console.log('%c[MODE SIMULASI] Mengambil misi...', 'color: #00AACC');
  return new Promise(resolve => setTimeout(() => resolve(mockMissions), 700));
};

export const verifyMission = async (missionId: string): Promise<{ success: boolean }> => {
  console.log(`%c[MODE SIMULASI] Verifikasi misi ${missionId}...`, 'color: #00AACC');
  const mission = mockMissions.find(m => m.id === missionId);
  if (mission) mission.status = 'completed';
  return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000));
};

export const getPortfolio = async (): Promise<any> => {
  console.log('%c[MODE SIMULASI] Mengambil portofolio...', 'color: #00AACC');
  const mockPortfolio = { totalUsdValue: 1250.75, positions: [{ id: 'lp1', type: 'amm', asset: 'USDT/LINKA LP', usdValue: 800.50 }] };
  return new Promise(resolve => setTimeout(() => resolve(mockPortfolio), 600));
};

export const getLeaderboard = async (): Promise<any[]> => {
  console.log('%c[MODE SIMULASI] Mengambil leaderboard...', 'color: #00AACC');
  const mockLeaderboard = [{ rank: 1, username: 'Dewi (Simulasi)', points: 25000 }];
  return new Promise(resolve => setTimeout(() => resolve(mockLeaderboard), 800));
};

export const getReferralData = async (): Promise<any> => {
  console.log('%c[MODE SIMULASI] Mengambil data referral...', 'color: #00AACC');
  const mockReferral = { referralCode: 'SIMULASI-123', totalReferrals: 5 };
  return new Promise(resolve => setTimeout(() => resolve(mockReferral), 400));
};

export const getAirdropData = async (): Promise<any> => {
  console.log('%c[MODE SIMULASI] Mengambil data airdrop...', 'color: #00AACC');
  const mockAirdrop = { isEligible: true, claimableAmount: 5230.50, claimed: false };
  return new Promise(resolve => setTimeout(() => resolve(mockAirdrop), 300));
};

export const sendChatMessage = async (text: string): Promise<string> => {
  console.log(`%c[MODE SIMULASI] Pesan AI diterima: "${text}"`, 'color: #00AACC');
  return new Promise(resolve => setTimeout(() => resolve(`Ini respons simulasi untuk "${text}".`), 1200));
};