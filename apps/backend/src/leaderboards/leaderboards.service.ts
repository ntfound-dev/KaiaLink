// File: apps/backend/src/leaderboards/leaderboards.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
type Decimal = Prisma.Decimal;


@Injectable()
export class LeaderboardsService {
  constructor(private prisma: PrismaService) {}

  async getTopUsers(limit = 100) {
    const users = await this.prisma.user.findMany({
      take: limit,
      orderBy: {
        points: 'desc',
      },
      select: {
        id: true,
        walletAddress: true,
        points: true,
      },
    });

    return users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));
  }

  /**
   * Update or create a leaderboard entry for a given metric and user.
   *
   * Accepts value as: number | bigint | Decimal | string.
   * Normalizes the value to a finite number before persisting.
   *
   * Strategy:
   *  - Prefer an upsert into a `leaderboard` table (if present in Prisma schema).
   *  - If that table/constraint is not present, fallback to incrementing
   *    the user's `points` field (if available).
   *  - If both fail, log a warning and move on (so the indexer won't crash).
   */
  async updateLeaderboardEntry(
    metric: string,
    userId: string,
    value: number | bigint | Decimal | string
  ): Promise<void> {
    // Normalisasi value -> number
    let valueNum: number;

    try {
      if (typeof value === 'object' && value !== null && typeof (value as any).toNumber === 'function') {
        // Prisma Decimal
        valueNum = (value as any).toNumber();
      } else if (typeof value === 'bigint') {
        valueNum = Number(value);
      } else if (typeof value === 'string') {
        valueNum = Number(value);
      } else {
        // number
        valueNum = value as number;
      }
    } catch (e) {
      // If normalization throws for some reason, log and abort the update.
      // eslint-disable-next-line no-console
      console.warn('updateLeaderboardEntry: failed to normalize value', { metric, userId, value, err: e });
      return;
    }

    if (!Number.isFinite(valueNum)) {
      // Do not attempt to persist non-finite numbers
      // eslint-disable-next-line no-console
      console.warn(`updateLeaderboardEntry: value not finite for metric=${metric}, user=${userId}`, value);
      return;
    }

    // Convert to an integer for point increments (no fractional points)
    const valueInt = Math.trunc(valueNum);

    // 1) Try upsert into `leaderboard` table if available
    try {
      const prismaAny = this.prisma as any;

      if (prismaAny.leaderboard && typeof prismaAny.leaderboard.upsert === 'function') {
        // NOTE: This assumes your Prisma schema defines a unique constraint named
        // `metric_userId` (composite of metric + userId). Adjust `where` if different.
        await prismaAny.leaderboard.upsert({
          where: { metric_userId: { metric, userId } },
          create: {
            metric,
            userId,
            // store numeric value; if you prefer strings, change this to value.toString()
            value: valueNum,
            updatedAt: new Date(),
          },
          update: {
            value: valueNum,
            updatedAt: new Date(),
          },
        });
        return;
      }
    } catch (e) {
      // If upsert fails (missing model, missing unique constraint, etc.),
      // we'll fallback below. Intentionally swallow the error here so the
      // indexer won't crash — but log a debug warning.
      // eslint-disable-next-line no-console
      console.debug('leaderboard upsert failed, falling back to user.points:', e?.message ?? e);
    }

    // 2) Fallback: increment `points` on the user record (if points field exists)
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          // assumes `points` is an Int field in your Prisma schema
          points: { increment: valueInt },
        },
      });
      return;
    } catch (e) {
      // Final fallback: log and don't throw. We prefer the indexer to keep running.
      // eslint-disable-next-line no-console
      console.warn(`Could not persist leaderboard entry for metric=${metric}, user=${userId}:`, e?.message ?? e);
    }
  }
}
