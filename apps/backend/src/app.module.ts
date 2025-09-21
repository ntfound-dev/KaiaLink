// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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

// Optional debugging controller
import { PingController } from './ping.controller';

@Module({
  imports: [
    // --- Modul Konfigurasi Global ---
    ConfigModule.forRoot({
      isGlobal: true,
      // Sesuaikan jika env file berada di tempat lain (misal: '.env.backend' atau '.env.local')
      envFilePath: '.env',
    }),

    PrismaModule,

    // --- Rate limiter / Throttling ---
    // Versi modern Throttler mengharapkan konfigurasi berupa array (bisa memiliki beberapa sets).
    // NOTE: ttl harus dalam MILISECOND — 60 detik = 60000 ms.
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60s => 60000 ms
        limit: 20,  // requests per ttl window
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
  // Tambah PingController untuk cek health/CORS tanpa auth
  controllers: [HealthController, PingController],
  providers: [
    // Terapkan Rate Limiting secara global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
