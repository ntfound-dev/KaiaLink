// File ini berisi semua definisi tipe data TypeScript
// yang digunakan bersama antara frontend dan lapisan API.

export interface UserProfile {
  lineUserId: string;
  username: string;
  walletAddress: string;
  points: number;
  level: 'Bronze' | 'Silver' | 'Epic' | 'Legendary';
  sbtUrl: string;
  socials: { 
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
}

export interface Mission {
  id: string;
  type: 'social' | 'tvl';
  title: string;
  description: string;
  points: number;
  status: 'available' | 'completed' | 'pending';
  actionUrl?: string;
}

export interface PortfolioPosition {
  id: string;
  type: 'amm' | 'lending_supply' | 'lending_borrow' | 'staking';
  asset: string;
  usdValue: number;
}

export interface Activity {
    id: string;
    type: 'Swap' | 'Join Mission' | 'Add Liquidity';
    description: string;
    timestamp: string;
}

export interface Portfolio {
  totalUsdValue: number;
  positions: PortfolioPosition[];
  recentActivity: Activity[];
}

export interface GlobalStats {
    totalTvl: number;
    swapVolume24h: number;
    totalUsers: number;
}

export interface LeaderboardUser {
    rank: number;
    username: string;
    points: number;
}

export interface LeaderboardTvlUser {
    rank: number;
    username: string;
    value: number; // Nilai dalam USD
}

export interface LeaderboardReferralUser {
    rank: number;
    username: string;
    referralCount: number;
}

export interface Referral {
    username: string;
    level: string;
    status: 'Qualified' | 'Pending';
}

export interface ReferralData {
    referralCode: string;
    totalReferrals: number;
    totalBonusPoints: number;
    referrals: Referral[];
}

export interface AirdropData {
    isEligible: boolean;
    claimableAmount: number;
    claimed: boolean;
}