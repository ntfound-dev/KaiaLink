// file: apps/backend/src/socials/telegram.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private BOT_TOKEN: string | undefined;
  private TELEGRAM_API_BASE: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Ambil token saat konstruksi (pastikan env sudah tersedia)
    this.BOT_TOKEN = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (this.BOT_TOKEN) {
      this.TELEGRAM_API_BASE = `https://api.telegram.org/bot${this.BOT_TOKEN}`;
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN tidak ditemukan di konfigurasi. Fitur Telegram tidak akan berfungsi.');
    }
  }

  /**
   * Cek apakah user adalah member grup Telegram
   */
  async isMemberOfGroup(telegramUserId: string, groupId: string): Promise<boolean> {
    if (!this.TELEGRAM_API_BASE) return false;

    const url = `${this.TELEGRAM_API_BASE}/getChatMember`;
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {
          chat_id: groupId, // ID grup target (misal: '@NamaGroup' atau '-100...' untuk grup privat)
          user_id: parseInt(telegramUserId, 10),
        }),
      );

      const status = response.data?.result?.status;
      // Pengguna dianggap member jika statusnya bukan 'left' atau 'kicked'
      return ['creator', 'administrator', 'member'].includes(status);
    } catch (error: any) {
      this.logger.error(
        `Gagal verifikasi member Telegram untuk user ${telegramUserId} di grup ${groupId}`,
        error?.response?.data ?? error?.message ?? error,
      );
      return false;
    }
  }

  /**
   * Kirim pesan ke user / chat Telegram
   */
  async sendMessage(telegramId: string, text: string): Promise<void> {
    if (!this.TELEGRAM_API_BASE) {
      this.logger.warn('Tidak dapat mengirim pesan Telegram: BOT token tidak tersedia.');
      return;
    }

    const url = `${this.TELEGRAM_API_BASE}/sendMessage`;
    try {
      const payload = {
        chat_id: telegramId,
        text,
        parse_mode: 'HTML', // atau 'MarkdownV2' sesuai kebutuhan
      };
      await firstValueFrom(this.httpService.post(url, payload));
      this.logger.log(`Pesan Telegram terkirim ke ${telegramId}`);
    } catch (error: any) {
      this.logger.error(`Gagal mengirim pesan Telegram ke ${telegramId}`, error?.response?.data ?? error?.message ?? error);
    }
  }
}
