import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AirdropService {
  constructor(private prisma: PrismaService) {}

  /**
   * Mengambil status airdrop untuk seorang pengguna.
   * @param userId ID pengguna yang sedang login
   */
  async getAirdropStatusForUser(userId: string) {
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

    // Format data agar sesuai dengan nama properti di frontend
    return {
      isEligible: user.isEligibleForAirdrop,
      claimed: user.hasClaimedAirdrop,
      claimableAmount: user.airdropAmount,
    };
  }

  /**
   * Memproses klaim airdrop oleh seorang pengguna.
   * @param userId ID pengguna yang sedang login
   */
  async claimAirdropForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isEligibleForAirdrop: true, hasClaimedAirdrop: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    // Validasi: Pastikan pengguna berhak dan belum pernah klaim
    if (!user.isEligibleForAirdrop) {
      throw new BadRequestException('Anda tidak memenuhi syarat untuk airdrop ini.');
    }
    if (user.hasClaimedAirdrop) {
      throw new BadRequestException('Anda sudah pernah mengklaim airdrop ini.');
    }

    // Proses klaim: Update status di database
    // Di aplikasi nyata, di sini juga bisa ditambahkan logika untuk mengirim token on-chain.
    await this.prisma.user.update({
      where: { id: userId },
      data: { hasClaimedAirdrop: true },
    });

    return { success: true, message: 'Airdrop berhasil diklaim!' };
  }
}