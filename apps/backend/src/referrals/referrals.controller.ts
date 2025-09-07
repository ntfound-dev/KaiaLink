// LOKASI FILE: apps/backend/src/referrals/referrals.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

class UseCodeDto {
  referralCode: string;
}

@ApiTags('referrals')
@Controller('referrals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('my-code')
  getMyCode(@Request() req) {
    return this.referralsService.getMyCode(req.user.userId);
  }

  @Post('use')
  useCode(@Request() req, @Body() useCodeDto: UseCodeDto) {
    return this.referralsService.useReferralCode(req.user.userId, useCodeDto.referralCode);
  }

  @Get('my-referrals')
  getMyReferrals(@Request() req) {
    return this.referralsService.getReferrals(req.user.userId);
  }
}