// LOKASI FILE: apps/backend/src/missions/missions.controller.ts
import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('missions')
@Controller('missions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  getUserMissions(@Request() req) {
    return this.missionsService.getUserMissions(req.user.userId);
  }

  @Post(':id/complete')
  completeMission(@Request() req, @Param('id') id: string) {
    return this.missionsService.completeMission(req.user.userId, id);
  }
}