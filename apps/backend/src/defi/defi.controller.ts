import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DefiService } from './defi.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'; // <-- Import ApiResponse

@ApiTags('defi')
@Controller('defi')
export class DefiController {
  constructor(private readonly defiService: DefiService) {}

  /**
   * Endpoint untuk mendapatkan data analitik dasar DeFi (misal: harga token).
   * Endpoint ini bersifat publik dan tidak memerlukan autentikasi.
   */
  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dapatkan data analitik dasar DeFi' })
  // --- REKOMENDASI: Tambahkan ApiResponse untuk dokumentasi yang lebih baik ---
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
  @ApiResponse({
    status: 503,
    description: 'Service tidak tersedia (jika API eksternal gagal dan tidak ada fallback).',
  })
  // --------------------------------------------------------------------------
  async getAnalytics() {
    // --- PERBAIKAN: Panggil nama method yang benar ---
    return this.defiService.getAnalyticsData(); // Sebelumnya: getAnalytics()
  }
}