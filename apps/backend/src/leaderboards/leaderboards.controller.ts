import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';

@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  /**
   * Endpoint ini akan menangani rute dinamis seperti:
   * GET /leaderboards/points
   * GET /leaderboards/swap
   * GET /leaderboards/amm
   */
  @Get(':name')
  async getLeaderboard(
    @Param('name') name: string, // 1. Ambil 'name' dari parameter URL
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    // 2. Panggil fungsi BARU 'getLeaderboardByName' di service dan teruskan 'name' ke dalamnya
    return this.leaderboardsService.getLeaderboardByName(name, limit || 100);
  }
}