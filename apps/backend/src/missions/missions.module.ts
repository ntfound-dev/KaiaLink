// LOKASI FILE: apps/backend/src/missions/missions.module.ts
// ---------------------------------------------------------

import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaderboardsModule } from '../leaderboards/leaderboards.module';
import { SocialsModule } from '../socials/socials.module';

@Module({
  imports: [
    PrismaModule,         // Diperlukan agar bisa inject PrismaService
    LeaderboardsModule,   // Diperlukan agar bisa inject LeaderboardsService
    SocialsModule,        // Diperlukan agar bisa inject semua social services
  ],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}