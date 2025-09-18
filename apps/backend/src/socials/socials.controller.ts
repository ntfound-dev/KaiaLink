// file: apps/backend/src/socials/socials.controller.ts

import {
  Controller, Get, Post, Query, Req, Res, UseGuards, Body,
  BadRequestException, Logger, InternalServerErrorException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'; // Path yang lebih baik
import { User } from '@prisma/client';

import { DiscordService } from './discord.service';
import { XService } from './x.service';
import { LineService } from './line.service';
import { TelegramService } from './telegram.service';
import * as crypto from 'crypto';

// Definisikan tipe untuk user yang terotentikasi dari JWT
interface AuthenticatedRequest extends Request {
  user: Pick<User, 'id'>;
}

@Controller('socials')
export class SocialsController {
  // Tambahkan Logger untuk debugging yang lebih baik
  private readonly logger = new Logger(SocialsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly discordService: DiscordService,
    private readonly xService: XService,
    private readonly lineService: LineService,
    private readonly telegramService: TelegramService,
  ) {}

  // ============================ DISCORD ============================
  @Get('connect/discord')
  @UseGuards(JwtAuthGuard)
  connectDiscord(@Res() res: Response) {
    const authUrl = this.discordService.getAuthorizationUrl();
    res.redirect(authUrl);
  }

  @Get('callback/discord')
  @UseGuards(JwtAuthGuard)
  async handleDiscordCallback(@Query('code') code: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    if (!code) throw new BadRequestException('Otorisasi Discord dibatalkan.');
    
    try {
      const tokenData = await this.discordService.exchangeCodeForToken(code);
      const userInfo = await this.discordService.getUserInfo(tokenData.access_token);
      
      await this.prisma.user.update({
        where: { id: req.user.id },
        data: {
          discordId: userInfo.id,
          discordAccessToken: tokenData.access_token,
          discordRefreshToken: tokenData.refresh_token,
        },
      });

      // Redirect kembali ke halaman profil frontend setelah sukses
      res.redirect(this.configService.get('FRONTEND_PROFILE_URL'));
    } catch (error) {
      this.logger.error('Discord callback error:', error);
      throw new InternalServerErrorException('Gagal menghubungkan akun Discord.');
    }
  }

  // ============================ X (TWITTER) ============================
  @Get('connect/x')
  @UseGuards(JwtAuthGuard)
  connectX(@Res() res: Response, @Req() req: AuthenticatedRequest) {
    const { authUrl, codeVerifier } = this.xService.getAuthorizationUrl();
    
    // Simpan codeVerifier di sesi (membutuhkan express-session)
    (req.session as any).x_code_verifier = codeVerifier;
    
    res.redirect(authUrl);
  }

  @Get('callback/x')
  @UseGuards(JwtAuthGuard)
  async handleXCallback(@Query('code') code: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    if (!code) throw new BadRequestException('Otorisasi X dibatalkan.');
    
    const codeVerifier = (req.session as any).x_code_verifier;
    if (!codeVerifier) throw new BadRequestException('Sesi tidak valid atau telah berakhir.');
    
    // Hapus verifier dari sesi setelah digunakan
    delete (req.session as any).x_code_verifier;

    try {
      const tokenData = await this.xService.exchangeCodeForToken(code, codeVerifier);
      const userInfo = await this.xService.getUserInfo(tokenData.access_token);
      
      await this.prisma.user.update({
        where: { id: req.user.id },
        data: {
          xId: userInfo.id,
          xAccessToken: tokenData.access_token,
          xRefreshToken: tokenData.refresh_token,
        },
      });
      
      res.redirect(this.configService.get('FRONTEND_PROFILE_URL'));
    } catch (error) {
      this.logger.error('X callback error:', error);
      throw new InternalServerErrorException('Gagal menghubungkan akun X.');
    }
  }

  // ============================ TELEGRAM ============================
  @Get('connect/telegram')
  @UseGuards(JwtAuthGuard)
  async getTelegramConnectLink(@Req() req: AuthenticatedRequest) {
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { telegramLinkToken: token, telegramTokenExpiry: expiry },
    });

    const botUsername = this.configService.get('TELEGRAM_BOT_USERNAME');
    return { 
      success: true, 
      url: `https://t.me/${botUsername}?start=${token}` 
    };
  }

  @Post('webhook/telegram')
  async handleTelegramWebhook(@Body() update: any, @Res() res: Response) {
    try {
      const message = update?.message;
      const text = message?.text;
      const telegramId = message?.from?.id.toString();

      if (text && telegramId && text.startsWith('/start ')) {
        const token = text.split(' ')[1];
        if (token) {
          const user = await this.prisma.user.findFirst({
            where: {
              telegramLinkToken: token,
              telegramTokenExpiry: { gt: new Date() },
            }
          });

          if (user) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: {
                telegramId: telegramId,
                telegramLinkToken: null,
                telegramTokenExpiry: null,
              }
            });
            
            this.logger.log(`Akun Telegram ${telegramId} berhasil ditautkan ke user ${user.id}`);
            // (Opsional) Kirim pesan konfirmasi kembali ke pengguna melalui bot
            await this.telegramService.sendMessage(telegramId, 'Akun Anda berhasil terhubung!');
          }
        }
      }
    } catch (error) {
      this.logger.error('Telegram webhook error:', error);
    } finally {
      // Selalu kembalikan 200 OK agar Telegram tidak mengirim ulang webhook
      res.status(200).send({ success: true });
    }
  }
}