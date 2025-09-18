// file: apps/backend/src/socials/socials.module.ts

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SocialsController } from './socials.controller';
import { DiscordService } from './discord.service';
import { XService } from './x.service';
import { LineService } from './line.service';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    HttpModule, // Penting untuk semua service yang melakukan panggilan API eksternal
  ],
  controllers: [SocialsController],
  providers: [DiscordService, XService, LineService, TelegramService],
  exports: [
    // Ekspor semua service agar bisa di-inject di MissionsModule
    DiscordService, 
    XService, 
    LineService, 
    TelegramService
  ],
})
export class SocialsModule {}