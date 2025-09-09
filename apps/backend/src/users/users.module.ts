import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // <-- Import UsersController
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  controllers: [UsersController], // <-- Daftarkan UsersController di sini
  exports: [UsersService],
})
export class UsersModule {}
