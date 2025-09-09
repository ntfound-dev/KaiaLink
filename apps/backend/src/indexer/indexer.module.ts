// LOKASI FILE: apps/backend/src/indexer/indexer.module.ts
// -------------------------------------------------------

import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { LeaderboardsModule } from '../leaderboards/leaderboards.module'; // ditambahkan

@Module({
  // Indexer butuh ConfigModule untuk .env, PrismaModule untuk DB,
  // dan LeaderboardsModule supaya LeaderboardsService bisa di-inject.
  imports: [ConfigModule, PrismaModule, LeaderboardsModule],
  providers: [IndexerService],
})
export class IndexerModule {}
