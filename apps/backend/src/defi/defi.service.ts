import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DefiService {
  private readonly logger = new Logger(DefiService.name);

  // URL dasar untuk API CoinGecko
  private readonly coinGeckoApiBaseUrl = 'https://api.coingecko.com/api/v3';

  // Data fallback jika API gagal
  private readonly fallbackData = {
    BTC: 112358.0,
    ETH: 4345.15,
    USDT: 1.0,
  };

  // Inject HttpService dan PrismaService
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async getPlatformConfig() {
    // Ambil semua konfigurasi aktif dari database secara bersamaan
    const [ammPools, stakingFarms, lendingMarkets] = await this.prisma.$transaction([
      this.prisma.ammPool.findMany({ where: { isActive: true } }),
      this.prisma.stakingFarm.findMany({ where: { isActive: true } }),
      this.prisma.lendingMarket.findMany({ where: { isActive: true } }),
    ]);

    return {
      pools: ammPools,
      farms: stakingFarms,
      markets: lendingMarkets,
    };
  }

  async getAnalyticsData(): Promise<Record<string, number>> {
    const coinIds = ['bitcoin', 'ethereum', 'tether'];
    const vsCurrency = 'usd';

    const url = `${this.coinGeckoApiBaseUrl}/simple/price`;
    const params = {
      ids: coinIds.join(','),
      vs_currencies: vsCurrency,
    };

    try {
      const response = await firstValueFrom(this.httpService.get(url, { params }));
      this.logger.log('Successfully fetched live crypto prices from CoinGecko.');

      const transformedData: Record<string, number> = {
        BTC: response.data.bitcoin?.[vsCurrency] ?? this.fallbackData.BTC,
        ETH: response.data.ethereum?.[vsCurrency] ?? this.fallbackData.ETH,
        USDT: response.data.tether?.[vsCurrency] ?? this.fallbackData.USDT,
      };

      return transformedData;
    } catch (error) {
      this.logger.error('Failed to fetch data from CoinGecko API.', (error as AxiosError).message);
      this.logger.warn('Returning fallback analytics data.');
      return this.fallbackData;
    }
  }

  /**
   * Statistik ringkas platform — menggunakan getPlatformConfig() yang sudah ada
   * sehingga kita menghindari mengakses model yang mungkin belum sesuai di schema.
   */
  async getStats() {
    const config = await this.getPlatformConfig();
    return {
      poolsCount: Array.isArray(config.pools) ? config.pools.length : 0,
      farmsCount: Array.isArray(config.farms) ? config.farms.length : 0,
      marketsCount: Array.isArray(config.markets) ? config.markets.length : 0,
    };
  }

  /**
   * Ringkasan DeFi untuk wallet tertentu.
   * Saat ini kembalikan ringkasan dasar + analytics — implementasi detail
   * (posisi, balances) tergantung pada skema DB/ tabel yang kamu punya.
   */
  async getUserDefiSummary(wallet: string) {
    // contoh return sementara yang berguna untuk UI sementara
    const analytics = await this.getAnalyticsData();

    // TODO: ganti bagian holdings dengan query ke tabel positions/holdings sesuai schema kamu
    return {
      wallet,
      analytics,
      holdings: [], // <-- isi dari DB sesuai model kamu
      note: 'Implement getUserDefiSummary to query positions/holdings in your DB schema.',
    };
  }
}
