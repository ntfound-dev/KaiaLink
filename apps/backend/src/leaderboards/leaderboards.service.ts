// LOKASI FILE: apps/backend/src/leaderboards/leaderboards.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}