// LOKASI FILE: apps/backend/src/airdrop/airdrop.module.ts
// -------------------------------------------------------

import { Module } from '@nestjs/common';
import { AirdropService } from './airdrop.service';
import { AirdropController } from './airdrop.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AirdropController],
  providers: [AirdropService],
})
export class AirdropModule {}
