// LOKASI FILE: apps/backend/src/app.module.ts
// ---------------------------------------------------------

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
// Modul Inti & Database
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

// Modul Fitur Aplikasi
import { IndexerModule } from './indexer/indexer.module';
import { DefiModule } from './defi/defi.module';
import { MissionsModule } from './missions/missions.module';
import { SocialsModule } from './socials/socials.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AirdropModule } from './airdrop/airdrop.module';

@Module({
  imports: [
    // --- Modul Konfigurasi Global ---
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),
    PrismaModule,
    ThrottlerModule.forRoot([
      { // Konfigurasi Rate Limiting Global
        ttl: 60000, // 1 menit
        limit: 20,  // 20 permintaan per IP per menit
      },
    ]),

    // --- Modul Inti Aplikasi ---
    AuthModule,
    UsersModule,

    // --- Modul Fitur Utama ---
    IndexerModule,
    DefiModule,
    SocialsModule,
    MissionsModule,
    LeaderboardsModule,
    ReferralsModule,
    AirdropModule,
    AiChatModule,
  ],
  controllers: [HealthController],
  providers: [
    // Terapkan Rate Limiting secara global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}