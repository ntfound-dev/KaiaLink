import { Controller, Get } from '@nestjs/common';

@Controller('ping')
export class PingController {
  @Get()
  ping() {
    return { ok: true, time: Date.now() };
  }
}
