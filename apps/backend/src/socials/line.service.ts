// file: src/socials/line.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { URLSearchParams } from 'url';

@Injectable()
export class LineService {
    private readonly logger = new Logger(LineService.name);
    private readonly LINE_API_BASE = 'https://api.line.me';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async exchangeCodeForToken(code: string): Promise<any> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.configService.get('LINE_REDIRECT_URI'),
            client_id: this.configService.get('LINE_CHANNEL_ID'),
            client_secret: this.configService.get('LINE_CHANNEL_SECRET'),
        });

        const response = await firstValueFrom(
            this.httpService.post(`${this.LINE_API_BASE}/oauth2/v2.1/token`, params),
        );
        return response.data; // Mengandung access_token, refresh_token, id_token
    }

    async getUserInfo(accessToken: string): Promise<any> {
        const response = await firstValueFrom(
            this.httpService.get(`${this.LINE_API_BASE}/v2/profile`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            }),
        );
        return response.data; // Mengandung userId, displayName, pictureUrl
    }

    /**
     * Memverifikasi apakah pengguna telah berteman dengan Official Account (OA).
     * Misi umum di LINE.
     */
    async isFriendOfOfficialAccount(accessToken: string): Promise<boolean> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.LINE_API_BASE}/friendship/v1/status`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }),
            );
            // `response.data.friendFlag` akan bernilai true jika berteman
            return response.data.friendFlag === true;
        } catch (error) {
            this.logger.error('Gagal memverifikasi status pertemanan LINE:', error.response?.data);
            return false;
        }
    }
}