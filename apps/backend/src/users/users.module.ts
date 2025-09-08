// LOKASI FILE: apps/backend/src/users/users.module.ts
// ---------------------------------------------------

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController, MeController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

