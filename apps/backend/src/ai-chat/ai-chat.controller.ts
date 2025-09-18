// Author: Putra Angga
// File: apps/backend/src/ai-chat/ai-chat.controller.ts

import { Readable } from 'stream';
import { StreamableFile, Controller, Post, Body } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  /** Endpoint untuk streaming response (mengembalikan StreamableFile) */
  @Post('stream')
  async streamResponse(@Body() body: { prompt: string; history?: any }) {
    const { prompt, history } = body;

    // generator: AsyncGenerator<string>
    const generator = this.aiChatService.generateResponseStream(prompt, history);

    // Wrap AsyncGenerator menjadi Readable
    const readable = Readable.from(
      (async function* () {
        for await (const chunk of generator) {
          if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
            yield typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
          } else {
            yield Buffer.from(String(chunk));
          }
        }
      })()
    );

    return new StreamableFile(readable, {
      type: 'text/plain; charset=utf-8',
    });
  }

  /** Simple endpoint untuk mendapatkan respons penuh (non-stream) */
  @Post('reply')
  async reply(@Body('prompt') prompt: string) {
    return this.aiChatService.generateResponse(prompt);
  }
}
