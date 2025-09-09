import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class DefiService {
  private readonly logger = new Logger(DefiService.name);
  
  // URL dasar untuk API CoinGecko
  private readonly coinGeckoApiBaseUrl = 'https://api.coingecko.com/api/v3';

  // Data fallback jika API gagal
  private readonly fallbackData = {
    BTC: 112358.00,
    ETH: 4345.15,
    USDT: 1.0,
  };

  // Aktifkan constructor untuk inject HttpService
  constructor(private readonly httpService: HttpService) {}

  /**
   * Mengambil data harga kripto secara real-time dari CoinGecko API.
   * Jika API gagal, akan mengembalikan data fallback.
   * @returns Objek yang berisi harga kripto.
   */
  async getAnalyticsData(): Promise<Record<string, number>> {
    // Daftar ID koin di CoinGecko yang ingin kita ambil harganya
    const coinIds = ['bitcoin', 'ethereum', 'tether'];
    const vsCurrency = 'usd';

    const url = `${this.coinGeckoApiBaseUrl}/simple/price`;
    const params = {
      ids: coinIds.join(','),
      vs_currencies: vsCurrency,
    };

    try {
      // Lakukan panggilan GET ke CoinGecko API
      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );
      
      this.logger.log('Successfully fetched live crypto prices from CoinGecko.');

      // Transformasi data dari format CoinGecko ke format yang kita inginkan
      // Contoh response.data: { "bitcoin": { "usd": 65000 }, "ethereum": { "usd": 3500 } }
      const transformedData: Record<string, number> = {
          BTC: response.data.bitcoin?.[vsCurrency] || this.fallbackData.BTC,
          ETH: response.data.ethereum?.[vsCurrency] || this.fallbackData.ETH,
          USDT: response.data.tether?.[vsCurrency] || this.fallbackData.USDT,
      };

      return transformedData;

    } catch (error) {
      // Error handling jika API CoinGecko tidak bisa dijangkau atau error
      this.logger.error('Failed to fetch data from CoinGecko API.', (error as AxiosError).message);
      
      // Kembalikan data statis sebagai fallback agar aplikasi tidak crash
      this.logger.warn('Returning fallback analytics data.');
      return this.fallbackData;
    }
  }
}