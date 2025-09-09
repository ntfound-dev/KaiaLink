// LOKASI FILE: apps/backend/src/prisma/prisma.service.ts
// ------------------------------------------------------

import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common'; // <-- 1. Import OnApplicationShutdown
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown { // <-- 2. Implementasikan interface-nya
  async onModuleInit() {
    // Menghubungkan ke database saat modul ini diinisialisasi
    await this.$connect();
    console.log('Successfully connected to the database.');
  }

  /**
   * --- PENAMBAHAN UNTUK GRACEFUL SHUTDOWN ---
   * Method ini akan otomatis dipanggil oleh NestJS sebelum aplikasi dimatikan.
   * Kita memastikan koneksi Prisma terputus dengan bersih.
   */
  async onApplicationShutdown(signal?: string) {
    console.log(`Application is shutting down due to ${signal || 'unknown signal'}. Disconnecting from the database.`);
    await this.$disconnect();
  }
}