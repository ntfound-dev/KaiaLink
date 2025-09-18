// Author: Putra Angga
// File: apps/backend/src/ai-chat/ai-chat.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  // gunakan `any` untuk menghindari konflik tipe sementara jika package typing berbeda
  private genAI: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY tidak ditemukan di .env');
    }
    // cast to any agar konstruksi kompatibel jika typing package berubah
    this.genAI = new (GoogleGenerativeAI as any)(apiKey);
  }

  /**
   * Menghasilkan respons penuh (string).
   * history bersifat opsional — jika nanti butuh context percakapan, kirimkan objek history.
   */
  async generateResponse(prompt: string, history?: any): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Tambahkan konteks agar AI tahu tentang proyek Anda
      const fullPrompt = `
        Anda adalah asisten AI untuk platform bernama KaiaLink.
        Jawab pertanyaan pengguna dengan ramah dan informatif dalam konteks KaiaLink, sebuah platform DeFi dan misi sosial di blockchain Kaia.
        Pertanyaan Pengguna: "${prompt}"
      `;

      const result = await model.generateContent(fullPrompt);
      // Beberapa SDK mengembalikan promise / object berbeda — normalisasi sedikit
      const response = await (result.response ?? result);
      const text = typeof response.text === 'function' ? response.text() : String(response);

      return text;
    } catch (error) {
      this.logger.error('Gagal menghasilkan respons dari Google AI:', error as any);
      return 'Maaf, saya sedang mengalami kesulitan untuk menjawab. Silakan coba lagi nanti.';
    }
  }

  /**
   * Async generator sederhana untuk streaming response.
   * Controller yang melakukan iteration (for await...of) akan menerima satu chunk (seluruh respons).
   * Jika nanti ingin streaming token-per-token, ubah implementasi ini sesuai API streaming model.
   */
  async *generateResponseStream(prompt: string, history?: any): AsyncGenerator<string, void, unknown> {
    try {
      const full = await this.generateResponse(prompt, history);
      // untuk sekarang yield seluruh jawaban sebagai satu chunk
      yield full;
    } catch (error) {
      this.logger.error('Gagal stream response:', error as any);
      yield 'Maaf, terjadi kesalahan saat streaming jawaban.';
    }
  }
}
