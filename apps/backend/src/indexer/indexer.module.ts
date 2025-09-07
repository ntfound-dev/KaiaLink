// LOKASI FILE: apps/backend/src/indexer/indexer.module.ts
// -------------------------------------------------------

import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  // Indexer butuh ConfigModule untuk .env dan PrismaModule untuk DB
  imports: [ConfigModule, PrismaModule],
  providers: [IndexerService],
})
export class IndexerModule {}
