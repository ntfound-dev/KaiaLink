// LOKASI FILE: apps/backend/src/defi/defi.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DefiService {
  private readonly COINGECKO_API_URL =
    'https://api.coingecko.com/api/v3/simple/price';

  constructor(private readonly httpService: HttpService) {}

  async getAnalytics() {
    try {
      const params = {
        ids: 'bitcoin,ethereum,tether',
        vs_currencies: 'usd',
      };

      const response$ = this.httpService.get(this.COINGECKO_API_URL, {
        params,
      });

      const response = await firstValueFrom(response$);
      const prices = response.data;

      return {
        BTC: prices.bitcoin?.usd || 0,
        ETH: prices.ethereum?.usd || 0,
        USDT: prices.tether?.usd || 0,
      };
    } catch (error) {
      console.error('Error fetching data from CoinGecko:', error);
      throw new InternalServerErrorException(
        'Gagal mengambil data analitik DeFi.',
      );
    }
  }
}