// apps/backend/src/missions/missions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { DiscordService } from '../socials/discord.service';
import { XService } from '../socials/x.service';
import { TelegramService } from '../socials/telegram.service';
import { LineService } from '../socials/line.service';
import { Mission, User, DeFiProfile, MissionType } from '@prisma/client';
import Decimal from 'decimal.js';

type UserWithDeFiProfile = User & { deFiProfile: DeFiProfile | null };

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);
  private readonly referralCommissionRate: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private discordService: DiscordService,
    private xService: XService,
    private telegramService: TelegramService,
    private lineService: LineService,
  ) {
    this.referralCommissionRate = parseFloat(
      this.configService.get<string>('REFERRAL_COMMISSION_RATE', '0.1'),
    );
  }

  // =================================================================
  // BAGIAN 1: FUNGSI CRUD ADMIN
  // =================================================================
  create(createMissionDto: CreateMissionDto) {
    return this.prisma.mission.create({ data: createMissionDto });
  }

  findAll() {
    return this.prisma.mission.findMany({ where: { isActive: true } });
  }

  async findOne(id: number) {
    const mission = await this.prisma.mission.findUnique({ where: { id } });
    if (!mission) {
      throw new NotFoundException(`Misi dengan ID "${id}" tidak ditemukan.`);
    }
    return mission;
  }

  async update(id: number, updateMissionDto: UpdateMissionDto) {
    await this.findOne(id); // pastikan ada
    return this.prisma.mission.update({ where: { id }, data: updateMissionDto });
  }

  async remove(id: number) {
    await this.findOne(id); // pastikan ada
    await this.prisma.mission.delete({ where: { id } });
    return { message: `Misi dengan ID ${id} berhasil dihapus` };
  }

  // =================================================================
  // BAGIAN 2: LOGIKA INTI & HELPER
  // =================================================================
  async completeMission(userId: string, missionId: number): Promise<any> {
    const { mission, user } = await this.validateInitialState(userId, missionId);

    const isVerified = await this._verifyMissionCompletion(mission, user);
    if (!isVerified) {
      throw new BadRequestException('Syarat misi belum terpenuhi.');
    }

    try {
      return this.awardPointsInTransaction(mission, user);
    } catch (error) {
      this.logger.error(`Transaksi gagal untuk user ${userId} di misi ${missionId}:`, error);
      throw new InternalServerErrorException('Gagal menyimpan progres misi, silakan coba lagi.');
    }
  }

  private async validateInitialState(userId: string, missionId: number) {
    const mission = await this.findOne(missionId);
    if (!mission.isActive) {
      throw new BadRequestException('Misi ini sedang tidak aktif.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { deFiProfile: true },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const alreadyCompleted = await this.prisma.completedMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (alreadyCompleted) {
      throw new BadRequestException('Anda sudah menyelesaikan misi ini sebelumnya.');
    }

    return { mission, user };
  }

  private async awardPointsInTransaction(mission: Mission, user: User) {
    return this.prisma.$transaction(async (tx) => {
      const awardedPoints = mission.points;

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: awardedPoints } },
        select: { points: true },
      });

      if (user.referredById) {
        const commissionPoints = Math.floor(awardedPoints * this.referralCommissionRate);
        if (commissionPoints > 0) {
          // Karena Anda menyatakan `referralPointsEarned` sudah ada di schema,
          // kita update kedua field: points dan referralPointsEarned.
          await tx.user.update({
            where: { id: user.referredById },
            data: {
              points: { increment: commissionPoints },
              referralPointsEarned: { increment: commissionPoints },
            },
          });
        }
      }

      await tx.completedMission.create({
        data: { userId: user.id, missionId: mission.id },
      });

      this.logger.log(`Misi "${mission.title}" oleh user ${user.id} berhasil, total poin baru: ${updatedUser.points}`);
      return {
        success: true,
        message: `Misi selesai! Anda mendapatkan ${awardedPoints} poin.`,
        newTotalPoints: updatedUser.points,
      };
    });
  }

  // =================================================================
  // BAGIAN 3: FUNGSI VERIFIKASI
  // =================================================================
  private async _verifyMissionCompletion(
    mission: Mission,
    user: UserWithDeFiProfile,
  ): Promise<boolean> {
    const { type, targetId } = mission;
    const deFiProfile = user.deFiProfile;

    switch (type) {
      // --- Misi Sosial ---
      case MissionType.JOIN_DISCORD_SERVER:
        if (!user.discordAccessToken) throw new BadRequestException('Akun Discord belum terhubung.');
        return this.discordService.isMemberOfServer(user.discordAccessToken, targetId);

      case MissionType.LIKE_TWEET_X:
        if (!user.xAccessToken || !user.xId) throw new BadRequestException('Akun X (Twitter) belum terhubung.');
        return this.xService.hasLikedTweet(user.xAccessToken, user.xId, targetId);

      case MissionType.JOIN_TELEGRAM_GROUP:
        if (!user.telegramId) throw new BadRequestException('Akun Telegram belum terhubung.');
        return this.telegramService.isMemberOfGroup(user.telegramId, targetId);

      case MissionType.ADD_LINE_OA:
        if (!user.lineAccessToken) throw new BadRequestException('Akun LINE belum terhubung.');
        return this.lineService.isFriendOfOfficialAccount(user.lineAccessToken);

      // --- Misi On-Chain (DeFi) ---
      case MissionType.SWAP_VOLUME_100:
        if (!deFiProfile) return false;
        return new Decimal(deFiProfile.totalSwapVolume).gte(100);

      case MissionType.HARVEST_REWARDS_ONCE:
        if (!deFiProfile) return false;
        return deFiProfile.harvestCount >= 1;

      case MissionType.SWAP_COUNT_5:
        if (!deFiProfile) return false;
        return deFiProfile.swapCount >= 5;

      // --- Misi yang tidak perlu verifikasi eksternal ---
      case MissionType.REFER_FRIEND:
        return true;

      // --- Fallback ---
      default:
        this.logger.warn(`Tipe misi tidak dikenal atau belum diimplementasikan verifikasinya: ${type}`);
        return false;
    }
  }
}
