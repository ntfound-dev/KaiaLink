// apps/frontend/types/shared.ts
// Versi tunggal, lengkap, dan backward-compatible dari definisi tipe yang
// digunakan oleh frontend. Tujuan: meminimalkan breaking change sementara
// menyediakan tipe yang jelas untuk UI dan model Prisma.

// ============================================================================
// ENUM & ALIAS
// ============================================================================
export enum MissionType {
  SOCIAL = 'SOCIAL',
  TVL = 'TVL',
  JOIN_DISCORD_SERVER = 'JOIN_DISCORD_SERVER',
  SWAP_COUNT_5 = 'SWAP_COUNT_5',
  SWAP_VOLUME_100 = 'SWAP_VOLUME_100',
  HARVEST_REWARDS_ONCE = 'HARVEST_REWARDS_ONCE',
}

export type IsoDateString = string;
export type UsdValueString = string; // decimal values from Prisma serialized as string

// ============================================================================
// PRISMA / SERVER-SIDE MODELS (SESUAI DENGAN `schema.prisma`)
// Simpan ini terpisah agar perubahan schema di backend dapat disinkronkan
// tanpa memengaruhi tipe UI yang lebih longgar.
// ============================================================================

export interface PrismaUserProfile {
  id: string;
  walletAddress: string;
  points: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;

  // Optional / nullable dari Prisma
  nonce?: string | null;
  telegramHandle?: string | null;
  discordId?: string | null;
  twitterHandle?: string | null;
  lineId?: string | null;
  lineAccessToken?: string | null;
  lineRefreshToken?: string | null;

  // SBT (kebanyakan BigInt/Address di-serialize sebagai string)
  sbtTokenId?: string | null;
  sbtContractAddress?: string | null;
  hasSbt?: boolean | null; // boolean di server, bisa null

  // Referral
  referredById?: string | null;
  referralCode?: string | null;

  // Airdrop
  isEligibleForAirdrop?: boolean;
  hasClaimedAirdrop?: boolean;
  airdropAmount?: number;

  // Relasi
  deFiProfile?: DeFiProfile | null;
  [key: string]: any; // fallback untuk kolom lain
}

// ============================================================================
// TIPE-TIPE UMUM / API
// ============================================================================

export interface DeFiProfile {
  id: number | string;
  userId: string;
  totalSwapVolume: UsdValueString;
  swapCount: number;
  totalStakingVolume: UsdValueString;
  harvestCount: number;
  totalLendSupplyVolume: UsdValueString;
  totalLendBorrowVolume: UsdValueString;
  totalAmmLiquidityVolume: UsdValueString;
  lastUpdatedAt: IsoDateString;
  lastUpdatedBlock?: string | null; // BigInt -> string
}

export interface Mission {
  isActive: boolean;
  targetId?: string | null;
  id: string;
  title: string;
  description: string;
  points: number;
  // backend menyederhanakan tipe menjadi sebuah kategori
  type: 'social' | 'on-chain' | string;
  status: 'completed' | 'available' | string;
  actionUrl?: string;
}

export interface GenericLeaderboardEntry {
  rank: number;
  username: string;
  value: number;
}

export interface LeaderboardEntry {
  rank: number;
  score: UsdValueString;
  user: { walletAddress: string; [key: string]: any };
}

export interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalBonusPoints: number;
  referrals: { walletAddress: string; status: 'Qualified' | 'Pending' }[];
}

export interface AirdropData {
  isEligible: boolean;
  claimableAmount: number;
  hasClaimed: boolean;
}

export interface Portfolio {
  totalUsdValue: UsdValueString;
  positions: { id: string; type: 'Staking' | 'AMM' | 'Lending'; asset: string; usdValue: UsdValueString }[];
}

export type Socials = {
  twitter?: string;
  discord?: string;
  telegram?: string;
  line?: string;
};

export type DefiStats = {
  totalSwapVolume?: number;
  totalStakingVolume?: number;
  totalLendSupplyVolume?: number;
};

// ============================================================================
// TIPE UNTUK FRONTEND / UI (lebih longgar, semua properti optional)
// Gunakan ini di komponen React dengan `Profile`.
// Ini dibuat agar perubahan di backend tidak mudah memecah UI.
// ============================================================================

export interface Profile {
  id?: string;
  username?: string;
  walletAddress?: string;
  socials?: Socials;
  rank?: number;
  points?: number;
  totalReferrals?: number;
  missionsCompleted?: number;
  defiStats?: DefiStats;
  level?: string; // e.g. 'bronze' | 'silver' | 'gold'
  hasSbt?: boolean;
  sbtUrl?: string;
  [key: string]: any; // fallback untuk properti tak terduga
}

export type Address = `0x${string}`;

export type Pool = {
  pairAddress: Address;
  tokenASymbol?: string;
  tokenAAddress?: Address;
  tokenBSymbol?: string;
  tokenBAddress?: Address;
  [key: string]: any;
};

export type Market = {
  // fields original
  id: string;
  symbol?: string;
  // fields expected by LendingMarketPanel:
  asset?: string;
  supplyApy?: number;
  borrowApy?: number;
  [key: string]: any;
};

export type Farm = {
  id: string;
  rewardToken?: string;
  [k: string]: any;
};

export type DeFiConfig = {
  pools?: Pool[];
  markets?: Market[];
  farms?: Farm[];
  routerAddress?: Address;
  [key: string]: any;
};




// ============================================================================
// EKSPORT DEFAULT / KOMBINASI (opsional)
// Tidak perlu mengubah import di project jika mereka mengimpor nama-nama di atas.
// ============================================================================

export type { PrismaUserProfile as UserProfilePrisma };
