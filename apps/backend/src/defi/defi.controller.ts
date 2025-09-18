import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { DefiService } from './defi.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('defi')
@Controller('defi')
export class DefiController {
  constructor(private readonly defiService: DefiService) {}

  @Get('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ambil konfigurasi platform DeFi (pools, farms, markets)' })
  @ApiResponse({ status: 200, description: 'Konfigurasi platform berhasil diambil.' })
  async getPlatformConfig() {
    return this.defiService.getPlatformConfig();
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dapatkan data analitik dasar DeFi (harga token)' })
  @ApiResponse({
    status: 200,
    description: 'Data harga token berhasil diambil.',
    schema: {
      example: {
        BTC: 68500.75,
        ETH: 3500.21,
        USDT: 1.0,
      },
    },
  })
  async getAnalytics() {
    return this.defiService.getAnalyticsData(); // memanggil method yang sudah ada di service
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Statistik singkat platform (counts)' })
  async getStats() {
    return this.defiService.getStats();
  }

  @Get('summary/:wallet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ringkasan DeFi untuk sebuah wallet' })
  async getUserSummary(@Param('wallet') wallet: string) {
    return this.defiService.getUserDefiSummary(wallet);
  }
}
