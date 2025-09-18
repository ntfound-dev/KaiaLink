import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // <-- 1. Impor HttpModule
import { DefiService } from './defi.service';
import { DefiController } from './defi.controller';
// Tidak perlu lagi mengimpor PrismaService di sini

@Module({
  imports: [
    HttpModule, // <-- 2. "Colokkan kabel" ke kotak perkakas HTTP
  ],
  controllers: [DefiController],
  providers: [DefiService], // <-- 3. Hanya daftarkan service yang spesifik untuk modul ini
  exports: [DefiService],
})
export class DefiModule {}