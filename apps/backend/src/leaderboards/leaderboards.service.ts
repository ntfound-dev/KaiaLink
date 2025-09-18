import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaderboardsService {
  constructor(private prisma: PrismaService) {}

  /**
   * [FUNGSI BARU PENGGANTI getTopUsers]
   * Mengambil data leaderboard berdasarkan nama/jenisnya secara dinamis.
   * Fungsi ini akan menjadi satu-satunya sumber data untuk semua jenis leaderboard.
   * @param name Nama leaderboard (cth: 'points', 'swap', 'amm')
   * @param limit Jumlah entri yang akan diambil
   * @returns Array entri leaderboard yang sudah siap digunakan oleh frontend
   */
  async getLeaderboardByName(name: string, limit = 100) {
    const leaderboard = await this.prisma.leaderboard.findUnique({
      where: { name },
      select: { id: true },
    });

    if (!leaderboard) {
      throw new NotFoundException(`Leaderboard with name "${name}" not found.`);
    }

    const entries = await this.prisma.leaderboardEntry.findMany({
      where: {
        leaderboardId: leaderboard.id,
      },
      take: limit,
      orderBy: {
        score: 'desc',
      },
      include: {
        user: {
          select: {
            // PERBAIKAN 1: Ganti 'username' dengan 'walletAddress' atau field lain yang ada
            walletAddress: true, 
          },
        },
      },
    });

    return entries.map((entry) => ({
      rank: entry.rank,
      // PERBAIKAN 2: Sesuaikan nama field di sini juga
      username: entry.user.walletAddress, 
      value: entry.score,
    }));
  }
 

  /**
   * Update or create a leaderboard entry for a given metric and user.
   */
  async updateLeaderboardEntry(
    metric: string,
    userId: string,
    value: number | bigint | Prisma.Decimal | string
  ): Promise<void> {
    // Normalisasi value -> number
    let valueNum: number;

    try {
      if (typeof value === 'object' && value !== null && typeof (value as any).toNumber === 'function') {
        valueNum = (value as any).toNumber();
      } else if (typeof value === 'bigint') {
        valueNum = Number(value);
      } else if (typeof value === 'string') {
        valueNum = Number(value);
      } else {
        valueNum = value as number;
      }
    } catch (e) {
      console.warn('updateLeaderboardEntry: failed to normalize value', { metric, userId, value, err: e });
      return;
    }

    if (!Number.isFinite(valueNum)) {
      console.warn(`updateLeaderboardEntry: value not finite for metric=${metric}, user=${userId}`, value);
      return;
    }

    // NOTE: Logika fallback ke 'points' di tabel User mungkin bisa Anda hapus
    // jika Anda sudah berkomitmen penuh menggunakan tabel LeaderboardEntry.
    // Namun untuk saat ini, kita biarkan saja sebagai pengaman.
    const valueInt = Math.trunc(valueNum);

    // 1) Try upsert into `leaderboard` table if available
    try {
      // Logika ini sudah dinamis dan akan mencari tabel leaderboard
      const leaderboard = await this.prisma.leaderboard.findUnique({ where: { name: metric } });
      if (leaderboard) {
        await this.prisma.leaderboardEntry.upsert({
            where: {
                leaderboardId_userId: {
                    leaderboardId: leaderboard.id,
                    userId: userId
                }
            },
            update: {
                score: valueNum,
            },
            create: {
                leaderboardId: leaderboard.id,
                userId: userId,
                score: valueNum,
                rank: 0, // Rank akan di-update oleh proses terpisah
            }
        });
        return;
      }
    } catch (e) {
      console.debug('leaderboard upsert failed, falling back to user.points:', e?.message ?? e);
    }

    // 2) Fallback: increment `points` on the user record (if points field exists)
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: valueInt },
        },
      });
      return;
    } catch (e) {
      console.warn(`Could not persist leaderboard entry for metric=${metric}, user=${userId}:`, e?.message ?? e);
    }
  }
}