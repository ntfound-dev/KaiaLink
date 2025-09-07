// LOKASI FILE: apps/backend/src/leaderboards/leaderboards.controller.ts
// ----------------------------------------------------------------------

import { Controller, Get } from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('leaderboards')
@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  /**
   * Endpoint publik untuk mendapatkan papan peringkat.
   * Tidak memerlukan token otentikasi.
   */
  @Get()
  getTopUsers() {
    return this.leaderboardsService.getTopUsers();
  }
}
