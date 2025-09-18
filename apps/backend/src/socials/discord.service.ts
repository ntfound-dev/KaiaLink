// Author: Putra Angga
// File: apps/backend/src/socials/discord.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { URLSearchParams } from 'url';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly DISCORD_API_BASE = 'https://discord.com/api/v10';
  private readonly scope = 'identify email';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Menghasilkan URL otorisasi Discord (OAuth2) berdasarkan env/config.
   * Kembalikan string kosong jika konfigurasi belum lengkap.
   */
  getAuthorizationUrl(): string {
    const clientId = this.configService.get<string>('DISCORD_CLIENT_ID') ?? '';
    const redirectUri = this.configService.get<string>('DISCORD_REDIRECT_URI') ?? '';
    if (!clientId || !redirectUri) {
      this.logger.warn('DISCORD_CLIENT_ID atau DISCORD_REDIRECT_URI belum di-set');
      return '';
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.scope,
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Tukar authorization code dengan access token
   */
  async exchangeCodeForToken(code: string): Promise<any> {
    const params = new URLSearchParams({
      client_id: this.configService.get<string>('DISCORD_CLIENT_ID') ?? '',
      client_secret: this.configService.get<string>('DISCORD_CLIENT_SECRET') ?? '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.configService.get<string>('DISCORD_REDIRECT_URI') ?? '',
    });

    const response = await firstValueFrom(
      this.httpService.post(`${this.DISCORD_API_BASE}/oauth2/token`, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
    return response.data;
  }

  /**
   * Ambil info user dari Discord menggunakan access token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.DISCORD_API_BASE}/users/@me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return response.data;
  }

  /**
   * Cek apakah user (akses token) tergabung di server tertentu
   */
  async isMemberOfServer(accessToken: string, serverId: string): Promise<boolean> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.DISCORD_API_BASE}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    const guilds = (response.data as any[]) ?? [];
    return guilds.some(guild => String(guild.id) === String(serverId));
  }
}
