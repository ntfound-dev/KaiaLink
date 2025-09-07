// LOKASI FILE: apps/backend/src/defi/defi.module.ts
// -------------------------------------------------

import { Module } from '@nestjs/common';
import { DefiService } from './defi.service';
import { DefiController } from './defi.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    // Impor HttpModule agar kita bisa menyuntikkan HttpService untuk membuat request API
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [DefiController],
  providers: [DefiService],
})
export class DefiModule {}
