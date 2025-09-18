// apps/frontend/lib/api/mock.ts
import type {
  Profile,
  Mission,
  Portfolio,
  GenericLeaderboardEntry,
  ReferralData,
  AirdropData,
} from '@/types/shared';

/**
 * Mock API (development)
 * - Menyertakan field wajib: Mission.isActive, AirdropData.hasClaimed
 * - Struktur disesuaikan agar cocok dengan definitions di types/shared.ts
 */

// helper latency
const mockApiCall = <T>(data: T, delay = 400): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), delay));

// -------------------- Mock data --------------------

const mockUser: Profile = {
  username: 'Budi (Simulasi)',
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  points: 1250,
  level: 'Silver',
  sbtUrl: '/sbt-silver.png',
  socials: { twitter: 'budisantoso' },
};

const mockMissions: Mission[] = [
  {
    id: 'tw-follow',
    type: 'social',
    title: 'Follow Twitter KaiaLink',
    description: 'Follow @kaialink untuk update terbaru.',
    points: 20,
    status: 'completed',
    actionUrl: 'https://twitter.com/kaialink',
    isActive: false, // <-- required
  },
  {
    id: 'tg-join',
    type: 'social',
    title: 'Gabung Grup Telegram',
    description: 'Bergabung dengan komunitas kami di Telegram.',
    points: 20,
    status: 'available',
    actionUrl: 'https://t.me/kaialink',
    isActive: true, // <-- required
  },
  {
    id: 'daily-checkin',
    type: 'social',
    title: 'Daily Check-in',
    description: 'Dapatkan poin bonus setiap hari!',
    points: 1,
    status: 'available',
    isActive: true, // <-- required
  },
  {
    id: 'tvl-lp',
    type: 'tvl',
    title: 'Sediakan Likuiditas',
    description: 'Sediakan likuiditas min. $50 di pool KAIA/USDT.',
    points: 500,
    status: 'available',
    actionUrl: '/defi/amm',
    isActive: true, // <-- required
  },
];

const mockPortfolio: Portfolio = {
  totalUsdValue: '5450.25',
  positions: [
    { id: 'amm1', type: 'AMM', asset: 'USDT/LINKA LP', usdValue: '2500.00' },
    { id: 'lend1', type: 'Lending', asset: 'KAIA', usdValue: '1500.00' },
    { id: 'lend2', type: 'Lending', asset: 'USDT (borrowed)', usdValue: '-500.00' },
    { id: 'stake1', type: 'Staking', asset: 'USDT/LINKA LP Farm', usdValue: '1950.25' },
  ],
  // removed recentActivity because Portfolio type doesn't include it in your types/shared.ts
};

const allMockLeaderboards: Record<string, GenericLeaderboardEntry[]> = {
  points: [
    { rank: 1, username: 'Dewi Lestari (mock)', value: 25000 },
    { rank: 2, username: 'Budi Santoso (mock)', value: 18500 },
  ],
  swap: [{ rank: 1, username: 'Sultan Swap (mock)', value: 150000.5 }],
  amm: [{ rank: 1, username: 'LP Master (mock)', value: 85000.0 }],
  lending: [{ rank: 1, username: 'Whale Lender (mock)', value: 120000.0 }],
  staking: [{ rank: 1, username: 'Farmer Sejati (mock)', value: 65000.0 }],
  referral: [{ rank: 1, username: 'Sang Konektor (mock)', value: 52 }],
};

const mockReferralData: ReferralData = {
  referralCode: 'KAIALINK-BUDI77',
  totalReferrals: 5,
  totalBonusPoints: 150,
  referrals: [
    // Use fields expected by your ReferralData type (walletAddress/status here)
    { walletAddress: '0xabc...', status: 'Qualified' },
    { walletAddress: '0xdef...', status: 'Pending' },
  ],
};

const mockAirdropData: AirdropData = {
  isEligible: true,
  claimableAmount: 5230.5,
  hasClaimed: false, // <-- required field per your types/shared.ts
};

// -------------------- Mock API --------------------

const api = {
  async getUserProfile(): Promise<Profile> {
    return mockApiCall(mockUser, 300);
  },

  async getMissions(): Promise<Mission[]> {
    return mockApiCall(mockMissions, 300);
  },

  async getPortfolio(): Promise<Portfolio> {
    return mockApiCall(mockPortfolio, 350);
  },

  // Keep return type `any` for global stats if your types/shared doesn't export GlobalStats
  async getGlobalStats(): Promise<any> {
    return mockApiCall(
      {
        totalTvl: 1_234_567.89,
        swapVolume24h: 345_678.9,
        totalUsers: 1_523,
      },
      200
    );
  },

  async getLeaderboard(category: string): Promise<GenericLeaderboardEntry[]> {
    return mockApiCall(allMockLeaderboards[category] ?? [], 400);
  },

  async getReferralData(): Promise<ReferralData> {
    return mockApiCall(mockReferralData, 300);
  },

  async getAirdropData(): Promise<AirdropData> {
    return mockApiCall(mockAirdropData, 300);
  },

  async verifyMission(missionId: string): Promise<{ success: boolean }> {
    const m = mockMissions.find((x) => x.id === missionId);
    if (m) {
      m.status = 'completed';
      m.isActive = false;
    }
    return mockApiCall({ success: true }, 500);
  },

  async sendChatMessage(text: string): Promise<string> {
    return mockApiCall(`Ini respons simulasi untuk "${text}".`, 600);
  },
};

export default api;
