// LOKASI FILE: apps/backend/src/prisma/prisma.service.ts
// ------------------------------------------------------

import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  private isShuttingDown = false;

  /**
   * Coba connect ke database dengan retry/backoff.
   * Kamu bisa override jumlah percobaan dan delay via env:
   *  - PRISMA_CONNECT_MAX_ATTEMPTS
   *  - PRISMA_CONNECT_INITIAL_DELAY_MS
   */
  async onModuleInit() {
    const maxAttempts = Number(process.env.PRISMA_CONNECT_MAX_ATTEMPTS) || 10;
    const initialDelayMs =
      Number(process.env.PRISMA_CONNECT_INITIAL_DELAY_MS) || 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (this.isShuttingDown) {
        // Jika aplikasi sudah mulai shutdown, hentikan upaya connect.
        throw new Error('Aborted prisma connection: application is shutting down.');
      }

      try {
        await this.$connect();
        console.log(`Prisma connected (attempt ${attempt}).`);
        return;
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn(
          `Prisma connect attempt ${attempt} failed: ${msg}`
        );

        if (attempt === maxAttempts) {
          console.error(
            `Prisma failed to connect after ${maxAttempts} attempts. Throwing error.`
          );
          // Biarkan NestJS menangani error (process akan crash atau supervisor restart)
          throw err;
        }

        // Backoff linear (bisa diganti eksponensial jika diinginkan)
        const waitMs = initialDelayMs * attempt;
        console.log(`Waiting ${waitMs}ms before next attempt...`);
        await new Promise((res) => setTimeout(res, waitMs));
      }
    }
  }

  /**
   * Graceful shutdown: set flag agar retry berhenti dan disconnect Prisma
   */
  async onApplicationShutdown(signal?: string) {
    this.isShuttingDown = true;
    console.log(
      `Application is shutting down due to ${signal || 'unknown signal'}. Disconnecting from the database...`
    );
    try {
      await this.$disconnect();
      console.log('Prisma disconnected cleanly.');
    } catch (err: any) {
      console.warn('Error while disconnecting Prisma:', err?.message || err);
    }
  }
}
