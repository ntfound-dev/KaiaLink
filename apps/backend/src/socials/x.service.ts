// file: src/socials/x.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { URLSearchParams } from 'url';

@Injectable()
export class XService {
  private readonly logger = new Logger(XService.name);
  private readonly X_API_BASE = 'https://api.twitter.com/2';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tukar authorization code menjadi access token
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const clientId = this.configService.get('X_CLIENT_ID');
    const clientSecret = this.configService.get('X_CLIENT_SECRET');
    const redirectUri = this.configService.get('X_REDIRECT_URI');

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const params = new URLSearchParams({
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await firstValueFrom(
      this.httpService.post('https://api.twitter.com/2/oauth2/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
      }),
    );
    return response.data;
  }

  /**
   * Ambil informasi user dari token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.X_API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return response.data.data;
  }

  /**
   * Cek apakah user sudah like tweet tertentu
   */
  async hasLikedTweet(accessToken: string, userId: string, tweetId: string): Promise<boolean> {
    const url = `${this.X_API_BASE}/users/${userId}/liked_tweets`;
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    const likedTweets = (response.data.data as any[]) || [];
    return likedTweets.some(tweet => tweet.id === tweetId);
  }

  /**
   * Buat URL untuk authorize PKCE (misal login OAuth)
   */
  getAuthorizationUrl(): { authUrl: string; codeVerifier: string } {
    const codeVerifier = 'some-random-string'; // ganti dengan generator PKCE nyata
    const authUrl = `https://x.com/oauth/authorize?...&code_challenge=${codeVerifier}`;
    return { authUrl, codeVerifier };
  }
}
