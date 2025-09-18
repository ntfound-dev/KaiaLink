import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AirdropService } from './airdrop.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('airdrop')
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  async getMyAirdropStatus(@Req() req) {
    const userId = req.user.id;
    return this.airdropService.getAirdropStatusForUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('claim')
  async claimMyAirdrop(@Req() req) {
    const userId = req.user.id;
    return this.airdropService.claimAirdropForUser(userId);
  }
}