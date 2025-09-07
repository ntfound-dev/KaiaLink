// LOKASI FILE: apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { MissionsModule } from './missions/missions.module';
import { DefiModule } from './defi/defi.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AirdropModule } from './airdrop/airdrop.module';
import { IndexerModule } from './indexer/indexer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    MissionsModule,
    DefiModule,
    LeaderboardsModule,
    ReferralsModule,
    AirdropModule,
    IndexerModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}