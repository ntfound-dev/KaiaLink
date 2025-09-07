// LOKASI FILE: apps/backend/src/prisma/prisma.service.ts
// ------------------------------------------------------

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Menghubungkan ke database saat modul ini diinisialisasi
    await this.$connect();
  }
}
