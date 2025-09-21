import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from '../common/dtos/update-user.dto';
import * as crypto from 'crypto';
import Decimal from 'decimal.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // FUNGSI DASAR & OTENTIKASI
  // =================================================================

  async findOrCreateByWalletAddress(walletAddress: string): Promise<User> {
    const lowercasedAddress = walletAddress.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: lowercasedAddress },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress: lowercasedAddress },
      });
    }
    return user;
  }

  async findOneByWalletAddress(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });
  }

  async refreshNonce(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        nonce: crypto.randomBytes(32).toString('hex'),
      },
    });
  }

  // =================================================================
  // FUNGSI PENGAMBILAN DATA PROFIL
  // =================================================================

  async findOne(id: string): Promise<Omit<User, 'nonce'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Ambil profil lengkap (dengan leaderboard, referrals, missions, dan deFiProfile).
   */
  async getFullProfile(userId: string) {
    if (!userId) throw new BadRequestException('userId missing');

    try {
      const userWithCounts = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          deFiProfile: true,
          _count: { select: { referrals: true, completedMissions: true } },
        },
      });

      if (!userWithCounts) {
        throw new NotFoundException('Pengguna tidak ditemukan.');
      }

      let rank = 0;
      const pointsLeaderboard = await this.prisma.leaderboard.findUnique({
        where: { name: 'points' },
        select: { id: true },
      });

      if (pointsLeaderboard) {
        const entry = await this.prisma.leaderboardEntry.findUnique({
          where: { leaderboardId_userId: { leaderboardId: pointsLeaderboard.id, userId } },
          select: { rank: true },
        });
        if (entry) rank = entry.rank;
      }

      return {
        username: userWithCounts.twitterHandle || `User_${userWithCounts.walletAddress.slice(-4)}`,
        walletAddress: userWithCounts.walletAddress,
        points: userWithCounts.points,
        rank,
        referralCode: userWithCounts.referralCode,
        totalReferrals: userWithCounts._count.referrals,
        missionsCompleted: userWithCounts._count.completedMissions,
        socials: {
          twitter: userWithCounts.twitterHandle,
          telegram: userWithCounts.telegramHandle,
          discord: userWithCounts.discordId,
          line: userWithCounts.lineId,
        },
        defiStats: userWithCounts.deFiProfile
          ? {
              totalSwapVolume: new Decimal(userWithCounts.deFiProfile.totalSwapVolume).toNumber(),
              totalStakingVolume: new Decimal(userWithCounts.deFiProfile.totalStakingVolume).toNumber(),
              totalLendSupplyVolume: new Decimal(userWithCounts.deFiProfile.totalLendSupplyVolume).toNumber(),
            }
          : null,
      };
    } catch (error) {
      this.logger.error(`Failed to get full profile for userId ${userId}:`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not retrieve user profile.');
    }
  }

  // =================================================================
  // FUNGSI UPDATE PROFIL & HELPER
  // =================================================================

  async updateProfile(userId: string, data: UpdateUserDto) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitizeUser(updatedUser);
  }

  private sanitizeUser(user: User): Omit<User, 'nonce'> {
    if (!user) return null;
    const { nonce, ...result } = user;
    return result;
  }

  async findById(id: string) {
    if (!id) return null;
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByWallet(walletAddress: string) {
    if (!walletAddress) return null;
    return this.prisma.user.findUnique({ where: { walletAddress } });
  }
}
