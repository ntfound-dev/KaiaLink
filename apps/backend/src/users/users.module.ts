// LOKASI FILE: apps/backend/src/users/users.module.ts
// ---------------------------------------------------

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Impor PrismaModule agar PrismaService tersedia
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Ekspor UsersService agar bisa digunakan oleh modul lain (seperti AuthModule)
})
export class UsersModule {}

