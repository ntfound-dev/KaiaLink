// LOKASI FILE: apps/backend/src/airdrop/airdrop.controller.ts
import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AirdropService } from './airdrop.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('airdrop')
@Controller('airdrop')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @Get('status')
  getAirdropStatus(@Request() req) {
    return this.airdropService.getAirdropStatus(req.user.userId);
  }

  @Post('claim')
  claimAirdrop(@Request() req) {
    return this.airdropService.claimAirdrop(req.user.userId);
  }
}