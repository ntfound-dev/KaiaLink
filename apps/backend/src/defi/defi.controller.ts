// LOKASI FILE: apps/backend/src/defi/defi.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DefiService } from './defi.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('defi')
@Controller('defi')
export class DefiController {
  constructor(private readonly defiService: DefiService) {}

  @Get('analytics')
  getAnalytics() {
    return this.defiService.getAnalytics();
  }
}