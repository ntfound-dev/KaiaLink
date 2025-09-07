// LOKASI FILE: apps/backend/src/leaderboards/leaderboards.module.ts
// ------------------------------------------------------------------

import { Module } from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';
import { LeaderboardsController } from './leaderboards.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LeaderboardsController],
  providers: [LeaderboardsService],
})
export class LeaderboardsModule {}
