// File ini berisi semua definisi tipe data TypeScript
// yang digunakan bersama antara frontend dan lapisan API.

// ============================================================================
// --- ENUM & TIPE DASAR ---
// PENINGKATAN: Menggunakan enum untuk tipe kategori agar terpusat dan aman dari typo.
// ============================================================================

export enum PositionType {
  AMM = 'amm',
  LENDING_SUPPLY = 'lending_supply',
  LENDING_BORROW = 'lending_borrow',
  STAKING = 'staking',
}

export enum MissionType {
    SOCIAL = 'social',
    TVL = 'tvl',
}

export enum MissionStatus {
    AVAILABLE = 'available',
    COMPLETED = 'completed',
    PENDING = 'pending',
}

// PENINGKATAN: Menggunakan tipe alias untuk kejelasan.
type IsoDateString = string;

// ============================================================================
// --- INTERFACE UTAMA ---
// ============================================================================

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
  type: MissionType;
  title: string;
  description: string;
  points: number;
  status: MissionStatus;
  actionUrl?: string;
}

// PENINGKATAN: Menggunakan 'string' untuk nilai finansial agar presisi terjaga.
export interface PortfolioPosition {
  id: string;
  type: PositionType;
  asset: string;
  usdValue: string; // Direkomendasikan string untuk presisi desimal
}

export interface Activity {
  id: string;
  type: 'Swap' | 'Join Mission' | 'Add Liquidity'; // Bisa juga dibuat enum jika jenisnya banyak
  description: string;
  timestamp: IsoDateString;
}

export interface Portfolio {
  totalUsdValue: string; // Direkomendasikan string untuk presisi desimal
  positions: PortfolioPosition[];
  recentActivity: Activity[];
}

export interface GlobalStats {
  totalTvl: string; // Direkomendasikan string untuk presisi desimal
  swapVolume24h: string; // Direkomendasikan string untuk presisi desimal
  totalUsers: number;
}

// --- Tipe Data untuk Leaderboard ---

export interface LeaderboardUser {
  rank: number;
  username: string;
  points: number;
}

export interface LeaderboardTvlUser {
  rank: number;
  username: string;
  value: string; // Direkomendasikan string untuk presisi desimal (nilai dalam USD)
}

export interface LeaderboardReferralUser {
  rank: number;
  username: string;
  referralCount: number;
}

// --- Tipe Data untuk Fitur Lain ---

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
  claimableAmount: number; // Bisa juga string jika jumlahnya desimal
  claimed: boolean;
}