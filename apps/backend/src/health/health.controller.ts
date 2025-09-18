// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      time: new Date().toISOString(),
    };
  }
}
