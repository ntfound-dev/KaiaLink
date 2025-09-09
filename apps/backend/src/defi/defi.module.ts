import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // <-- 1. Import HttpModule
import { DefiService } from './defi.service';
import { DefiController } from './defi.controller';

@Module({
  imports: [HttpModule], // <-- 2. Tambahkan di sini
  providers: [DefiService],
  controllers: [DefiController],
})
export class DefiModule {}