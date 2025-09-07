// LOKASI FILE: apps/backend/src/referrals/referrals.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REFERRER_REWARD_POINTS = 100;
const REFERRED_REWARD_POINTS = 50;

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async getMyCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }
    return { referralCode: user.referralCode };
  }

  async useReferralCode(userId: string, referralCode: string) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });
    if (!referrer) {
      throw new NotFoundException('Kode referral tidak valid.');
    }

    const referredUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!referredUser) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    if (referrer.id === referredUser.id) {
      throw new BadRequestException('Anda tidak bisa menggunakan kode referral sendiri.');
    }

    if (referredUser.referredById) {
      throw new BadRequestException('Anda sudah pernah menggunakan kode referral.');
    }

    await this.prisma.user.update({
      where: { id: referredUser.id },
      data: {
        referredById: referrer.id,
        points: {
          increment: REFERRED_REWARD_POINTS,
        },
      },
    });

    await this.prisma.user.update({
      where: { id: referrer.id },
      data: {
        points: {
          increment: REFERRER_REWARD_POINTS,
        },
      },
    });

    return { message: 'Kode referral berhasil digunakan.' };
  }

  async getReferrals(userId: string) {
    const referrals = await this.prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        walletAddress: true,
        createdAt: true,
      },
    });
    return referrals;
  }
}