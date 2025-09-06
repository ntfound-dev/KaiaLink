import type { UserProfile, Mission, Portfolio, GlobalStats, LeaderboardUser, LeaderboardTvlUser, LeaderboardReferralUser, ReferralData, AirdropData } from '@/types/shared';

// ============================================================================
// --- MOCK DATABASE (Satu sumber data palsu untuk seluruh aplikasi) ---
// ============================================================================

const mockUser: UserProfile = {
  lineUserId: 'U123456789',
  username: 'Budi (Simulasi)',
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  points: 1250,
  level: 'Silver',
  sbtUrl: '/sbt-silver.png',
  socials: { 
    twitter: 'budisantoso',
  },
};

const mockMissions: Mission[] = [
  { id: 'tw-follow', type: 'social', title: 'Follow Twitter KaiaLink', description: 'Follow @kaialink untuk update terbaru.', points: 20, status: 'completed', actionUrl: 'https://twitter.com/kaialink' },
  { id: 'tg-join', type: 'social', title: 'Gabung Grup Telegram', description: 'Bergabung dengan komunitas kami di Telegram.', points: 20, status: 'available', actionUrl: 'https://t.me/kaialink' },
  { id: 'daily-checkin', type: 'social', title: 'Daily Check-in', description: 'Dapatkan poin bonus setiap hari!', points: 1, status: 'available' },
  { id: 'tvl-lp', type: 'tvl', title: 'Sediakan Likuiditas', description: 'Sediakan likuiditas min. $50 di pool KAIA/USDT.', points: 500, status: 'available', actionUrl: '/defi/amm' },
];

const mockGlobalStats: GlobalStats = {
    totalTvl: 1234567.89,
    swapVolume24h: 345678.90,
    totalUsers: 1523,
};

const mockPortfolio: Portfolio = {
  totalUsdValue: 5450.25,
  positions: [
    { id: 'amm1', type: 'amm', asset: 'USDT/LINKA LP', usdValue: 2500.00 },
    { id: 'lend1', type: 'lending_supply', asset: 'KAIA', usdValue: 1500.00 },
    { id: 'lend2', type: 'lending_borrow', asset: 'USDT', usdValue: -500.00 },
    { id: 'stake1', type: 'staking', asset: 'USDT/LINKA LP Farm', usdValue: 1950.25 },
  ],
  recentActivity: [
      { id: 'act1', type: 'Swap', description: 'Menukar 100 USDT dengan 50 LINKA', timestamp: '5 menit lalu' },
      { id: 'act2', type: 'Join Mission', description: 'Menyelesaikan misi Follow Twitter', timestamp: '2 jam lalu' },
  ]
};

const mockLeaderboardPoints: LeaderboardUser[] = [
  { rank: 1, username: 'Dewi Lestari', points: 25000 },
  { rank: 2, username: 'Budi Santoso', points: 1250 },
  { rank: 3, username: 'Ahmad Yani', points: 980 },
];

const mockLeaderboardTvl: LeaderboardTvlUser[] = [
  { rank: 1, username: 'Sultan DeFi', value: 150000.50 },
  { rank: 2, username: 'Paus Kripto', value: 98000.75 },
];

const mockLeaderboardAmm: LeaderboardTvlUser[] = [
    { rank: 1, username: 'LP Master', value: 85000.00 },
];

const mockLeaderboardLending: LeaderboardTvlUser[] = [
    { rank: 1, username: 'Whale Lender', value: 120000.00 },
];

const mockLeaderboardStaking: LeaderboardTvlUser[] = [
    { rank: 1, username: 'Farmer Sejati', value: 65000.00 },
];

const mockLeaderboardReferral: LeaderboardReferralUser[] = [
    { rank: 1, username: 'Sang Konektor', referralCount: 52 },
    { rank: 2, username: 'Dewi Lestari', referralCount: 35 },
];

const mockReferralData: ReferralData = {
  referralCode: 'KAIALINK-BUDI77',
  totalReferrals: 5,
  totalBonusPoints: 150,
  referrals: [
      { username: 'Siti', level: 'Silver', status: 'Qualified' },
      { username: 'Eko', level: 'Bronze', status: 'Pending' },
  ]
};

const mockAirdropData: AirdropData = {
  isEligible: true,
  claimableAmount: 5230.50,
  claimed: false,
};

// ============================================================================
// --- IMPLEMENTASI FUNGSI MOCK API ---
// ============================================================================

/** Fungsi pembantu untuk mensimulasikan panggilan API dengan delay. */
const mockApiCall = <T>(data: T, delay = 700): Promise<T> => {
    console.log(`%c[MODE SIMULASI] Mengembalikan data...`, 'color: #00AACC');
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

export const getUserProfile = () => mockApiCall(mockUser, 500);
export const getMissions = () => mockApiCall(mockMissions);
export const getPortfolio = () => mockApiCall(mockPortfolio, 600);
export const getGlobalStats = () => mockApiCall(mockGlobalStats, 400);

export const getLeaderboard = () => mockApiCall(mockLeaderboardPoints, 800);
export const getLeaderboardTVL = () => mockApiCall(mockLeaderboardTvl, 900);
export const getLeaderboardSwap = () => mockApiCall(mockLeaderboardTvl.slice(0,1), 950); // Menggunakan data TVL untuk demo
export const getLeaderboardAmm = () => mockApiCall(mockLeaderboardAmm, 950);
export const getLeaderboardLending = () => mockApiCall(mockLeaderboardLending, 950);
export const getLeaderboardStaking = () => mockApiCall(mockLeaderboardStaking, 950);
export const getLeaderboardReferral = () => mockApiCall(mockLeaderboardReferral, 850); 

export const getReferralData = () => mockApiCall(mockReferralData, 600);
export const getAirdropData = () => mockApiCall(mockAirdropData, 500);

export const verifyMission = async (missionId: string): Promise<{ success: boolean }> => {
  const mission = mockMissions.find(m => m.id === missionId);
  if (mission) mission.status = 'completed';
  return mockApiCall({ success: true }, 1000);
};

export const sendChatMessage = (text: string): Promise<string> => {
  return mockApiCall(`Ini respons simulasi untuk "${text}".`, 1200);
};

