// LOKASI FILE: apps/backend/src/airdrop/airdrop.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AirdropService {
  constructor(private prisma: PrismaService) {}

  async getAirdropStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isEligibleForAirdrop: true,
        hasClaimedAirdrop: true,
        airdropAmount: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    return {
      isEligible: user.isEligibleForAirdrop,
      hasClaimed: user.hasClaimedAirdrop,
      amount: user.airdropAmount,
    };
  }

  async claimAirdrop(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }
    if (!user.isEligibleForAirdrop) {
      throw new BadRequestException('Anda tidak memenuhi syarat untuk airdrop.');
    }
    if (user.hasClaimedAirdrop) {
      throw new BadRequestException('Anda sudah pernah mengklaim airdrop.');
    }

    console.log(
      `MENGIRIM ${user.airdropAmount} TOKEN KE ${user.walletAddress}... (Simulasi)`,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hasClaimedAirdrop: true,
      },
    });

    return {
      message: 'Airdrop berhasil diklaim!',
      amount: user.airdropAmount,
      walletAddress: user.walletAddress,
    };
  }
}