// LOKASI FILE: apps/backend/src/missions/missions.module.ts
// ---------------------------------------------------------

import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaderboardsModule } from '../leaderboards/leaderboards.module'; // <-- 1. IMPORT LeaderboardsModule

@Module({
  imports: [
    PrismaModule,
    LeaderboardsModule, // <-- 2. TAMBAHKAN di sini agar MissionsService bisa inject LeaderboardsService
  ],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}