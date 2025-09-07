// LOKASI FILE: apps/backend/src/missions/missions.module.ts
// ---------------------------------------------------------

import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Butuh PrismaService untuk interaksi DB
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}
