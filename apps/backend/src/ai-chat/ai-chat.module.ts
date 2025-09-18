// apps/backend/src/ai-chat/ai-chat.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AiChatController],
  providers: [AiChatService],
  exports: [AiChatService], // export kalau service dipakai di module lain
})
export class AiChatModule {}
