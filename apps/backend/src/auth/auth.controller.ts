// LOKASI FILE: apps/backend/src/auth/auth.controller.ts
// -----------------------------------------------------

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SignInDto, VerifyDto } from '../common/dtos/auth.dto';

@ApiTags('auth') // Mengelompokkan endpoint ini di bawah tag 'auth' di Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Langkah 1: Meminta pesan unik untuk ditandatangani oleh wallet.
   * Klien mengirimkan walletAddress mereka.
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Minta pesan untuk ditandatangani (Langkah 1)' })
  async getSignMessage(@Body() signInDto: SignInDto) {
    // Menggunakan DTO untuk validasi otomatis
    return this.authService.getSignMessage(signInDto.walletAddress);
  }

  /**
   * Langkah 2: Memverifikasi tanda tangan.
   * Klien mengirimkan walletAddress dan signature.
   * Jika berhasil, akan mengembalikan JWT (JSON Web Token).
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifikasi tanda tangan & dapatkan JWT (Langkah 2)' })
  async verifySignature(@Body() verifyDto: VerifyDto) {
    // Menggunakan DTO untuk validasi otomatis
    return this.authService.verifySignature(
      verifyDto.walletAddress,
      verifyDto.signature,
    );
  }
}

