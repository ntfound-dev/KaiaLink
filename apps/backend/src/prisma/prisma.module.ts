// LOKASI FILE: apps/backend/src/prisma/prisma.module.ts
// -----------------------------------------------------

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Menjadikan modul ini @Global() agar PrismaService 
// tersedia di semua modul lain tanpa perlu mengimpor PrismaModule secara eksplisit.
@Global() 
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Ekspor service agar bisa di-inject di tempat lain
})
export class PrismaModule {}
