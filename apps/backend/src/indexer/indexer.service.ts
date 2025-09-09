import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardsService } from '../leaderboards/leaderboards.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers'; // Diaktifkan untuk implementasi nyata
import { LeaderboardsModule } from '../leaderboards/leaderboards.module';
// Placeholder untuk ABI (Application Binary Interface) dari smart contract Anda.
// Anda harus menggantinya dengan ABI JSON dari kontrak Anda yang sudah di-compile.
const YOUR_CONTRACT_ABI = [
  "event Swapped(address indexed user, uint256 amountIn, uint256 amountOut)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event Harvested(address indexed user, uint256 rewardAmount)",
  "event Supplied(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event Borrowed(address indexed user, uint256 amount)",
  "event Repaid(address indexed user, uint256 amount)",
  "event LiquidityAdded(address indexed user, uint256 amountA, uint256 amountB)",
  "event LiquidityRemoved(address indexed user, uint256 amountA, uint256 amountB)",
];

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(
    private prisma: PrismaService,
    private leaderboardsService: LeaderboardsService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.logger.log('Menginisialisasi Indexer Service...');
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const contractAddress = this.configService.get<string>('YOUR_CONTRACT_ADDRESS');

    if (!rpcUrl || !contractAddress) {
      this.logger.error(
        'RPC_URL atau YOUR_CONTRACT_ADDRESS tidak disetel di .env. Indexer tidak akan berjalan.',
      );
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contract = new ethers.Contract(contractAddress, YOUR_CONTRACT_ABI, this.provider);
      this.listenToChainEvents();
    } catch (error) {
      this.logger.error('Gagal menginisialisasi koneksi Ethers.js', error);
    }
  }

  /**
   * Menemukan pengguna berdasarkan alamat wallet atau membuatnya jika tidak ada.
   * Juga memastikan profil DeFi untuk pengguna tersebut ada.
   * Ini adalah fungsi inti untuk memastikan semua event diproses untuk pengguna yang valid.
   * @param walletAddress Alamat wallet dari event on-chain.
   * @returns ID pengguna internal (UUID).
   */
  private async findOrCreateUserAndProfile(walletAddress: string): Promise<string> {
    const lowercasedAddress = walletAddress.toLowerCase();
    const user = await this.prisma.user.upsert({
      where: { walletAddress: lowercasedAddress },
      update: {},
      create: { walletAddress: lowercasedAddress },
    });

    // Pastikan DeFiProfile ada untuk pengguna ini
    await this.prisma.deFiProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return user.id;
  }

  /**
   * Listener utama yang mengikat fungsi-fungsi proses ke event smart contract.
   */
  private listenToChainEvents() {
    this.logger.log(`Mulai mendengarkan event dari kontrak di alamat ${this.contract.address}`);

    // Gunakan void untuk eksplisit fire-and-forget agar niat tidak berubah (sama seperti versi asli)
    this.contract.on('Swapped', (user: string, amountIn: bigint) => {
      void this.processSwapEvent(user, parseFloat(ethers.formatEther(amountIn)));
    });

    this.contract.on('Staked', (user: string, amount: bigint) => {
      void this.updateStakingVolume(user, parseFloat(ethers.formatEther(amount)));
    });

    this.contract.on('Unstaked', (user: string, amount: bigint) => {
      void this.updateStakingVolume(user, -parseFloat(ethers.formatEther(amount))); // Kirim nilai negatif (sama seperti logika asli)
    });

    this.contract.on('Harvested', (user: string) => {
      void this.processHarvestEvent(user);
    });

    this.contract.on('Supplied', (user: string, amount: bigint) => {
      void this.updateLendSupplyVolume(user, parseFloat(ethers.formatEther(amount)));
    });

    this.contract.on('Withdrawn', (user: string, amount: bigint) => {
      void this.updateLendSupplyVolume(user, -parseFloat(ethers.formatEther(amount)));
    });

    this.contract.on('Borrowed', (user: string, amount: bigint) => {
      void this.updateLendBorrowVolume(user, parseFloat(ethers.formatEther(amount)));
    });

    this.contract.on('Repaid', (user: string, amount: bigint) => {
      void this.updateLendBorrowVolume(user, -parseFloat(ethers.formatEther(amount)));
    });

    this.contract.on('LiquidityAdded', (user: string, amountA: bigint, amountB: bigint) => {
      const totalAmount = parseFloat(ethers.formatEther(amountA)) + parseFloat(ethers.formatEther(amountB));
      void this.updateAmmLiquidityVolume(user, totalAmount);
    });

    this.contract.on('LiquidityRemoved', (user: string, amountA: bigint, amountB: bigint) => {
      const totalAmount = parseFloat(ethers.formatEther(amountA)) + parseFloat(ethers.formatEther(amountB));
      void this.updateAmmLiquidityVolume(user, -totalAmount);
    });
  }

  // --- Implementasi Logika untuk Setiap Event ---

  async processSwapEvent(walletAddress: string, amountIn: number) {
    try {
      const userId = await this.findOrCreateUserAndProfile(walletAddress);
      const updatedProfile = await this.prisma.deFiProfile.update({
        where: { userId },
        data: {
          totalSwapVolume: { increment: amountIn },
          swapCount: { increment: 1 },
        },
      });

      await this.leaderboardsService.updateLeaderboardEntry('SWAP_VOLUME', userId, updatedProfile.totalSwapVolume);
      this.logger.log(`Swap event diproses untuk user: ${userId}`);
    } catch (error) {
      this.logger.error(`Gagal memproses Swap event untuk ${walletAddress}`, error);
    }
  }

  async updateStakingVolume(walletAddress: string, amount: number) {
    try {
      const userId = await this.findOrCreateUserAndProfile(walletAddress);
      const updatedProfile = await this.prisma.deFiProfile.update({
        where: { userId },
        data: { totalStakingVolume: { increment: amount } },
      });

      await this.leaderboardsService.updateLeaderboardEntry('STAKING_VOLUME', userId, updatedProfile.totalStakingVolume);
      this.logger.log(`Volume staking diupdate untuk user ${userId} sebesar ${amount}`);
    } catch (error) {
      this.logger.error(`Gagal mengupdate volume staking untuk ${walletAddress}`, error);
    }
  }

  async processHarvestEvent(walletAddress: string) {
    try {
      const userId = await this.findOrCreateUserAndProfile(walletAddress);
      await this.prisma.deFiProfile.update({
        where: { userId },
        data: { harvestCount: { increment: 1 } },
      });
      this.logger.log(`Harvest event diproses untuk user: ${userId}`);
    } catch (error) {
      this.logger.error(`Gagal memproses Harvest event untuk ${walletAddress}`, error);
    }
  }

  async updateLendSupplyVolume(walletAddress: string, amount: number) {
    try {
      const userId = await this.findOrCreateUserAndProfile(walletAddress);
      const updatedProfile = await this.prisma.deFiProfile.update({
        where: { userId },
        data: { totalLendSupplyVolume: { increment: amount } },
      });

      await this.leaderboardsService.updateLeaderboardEntry('LENDING_VOLUME', userId, updatedProfile.totalLendSupplyVolume);
      this.logger.log(`Volume lend supply diupdate untuk user ${userId} sebesar ${amount}`);
    } catch (error) {
      this.logger.error(`Gagal mengupdate volume lend supply untuk ${walletAddress}`, error);
    }
  }

  async updateLendBorrowVolume(walletAddress: string, amount: number) {
    try {
      const userId = await this.findOrCreateUserAndProfile(walletAddress);
      await this.prisma.deFiProfile.update({
        where: { userId },
        data: { totalLendBorrowVolume: { increment: amount } },
      });
      this.logger.log(`Volume lend borrow diupdate untuk user ${userId} sebesar ${amount}`);
    } catch (error) {
      this.logger.error(`Gagal mengupdate volume lend borrow untuk ${walletAddress}`, error);
    }
  }

  async updateAmmLiquidityVolume(walletAddress: string, amount: number) {
    try {
      const userId = await this.findOrCreateUserAndProfile(walletAddress);
      const updatedProfile = await this.prisma.deFiProfile.update({
        where: { userId },
        data: { totalAmmLiquidityVolume: { increment: amount } },
      });

      await this.leaderboardsService.updateLeaderboardEntry('AMM_VOLUME', userId, updatedProfile.totalAmmLiquidityVolume);
      this.logger.log(`Volume AMM liquidity diupdate untuk user ${userId} sebesar ${amount}`);
    } catch (error) {
      this.logger.error(`Gagal mengupdate volume AMM liquidity untuk ${walletAddress}`, error);
    }
  }
}
