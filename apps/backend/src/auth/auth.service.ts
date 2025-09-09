import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Membuat pesan unik untuk ditandatangani oleh wallet pengguna.
   * Secara otomatis membuat atau memperbarui nonce pengguna di database.
   */
  async getSignMessage(walletAddress: string): Promise<{ message: string }> {
    const nonce = uuidv4();
    const message = `Selamat datang di KaiaLink! Silakan tanda tangani pesan ini untuk login. Nonce: ${nonce}`;

    await this.prisma.user.upsert({
      where: { walletAddress },
      update: { nonce },
      create: { walletAddress, nonce },
    });
    return { message };
  }

  /**
   * Memverifikasi tanda tangan digital dari pengguna.
   * Jika valid, mengembalikan sebuah JWT access token.
   */
  async verifySignature(
    walletAddress: string,
    signature: string,
  ): Promise<{ accessToken: string }> {
    // 1. Temukan pengguna berdasarkan alamat wallet
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    // 2. Pastikan pengguna ada dan memiliki nonce yang valid
    if (!user || !user.nonce) {
      throw new UnauthorizedException('User tidak ditemukan atau nonce tidak valid.');
    }

    // 3. Rekonstruksi pesan yang seharusnya ditandatangani
    const expectedMessage = `Selamat datang di KaiaLink! Silakan tanda tangani pesan ini untuk login. Nonce: ${user.nonce}`;

    try {
      // 4. Verifikasi signature untuk mendapatkan kembali alamat penandatangan
      const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);

      // 5. Bandingkan alamat yang dipulihkan dengan alamat yang diberikan
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Tanda tangan tidak valid.');
      }

      // 6. Jika berhasil, hapus nonce agar tidak bisa dipakai lagi (keamanan)
      await this.prisma.user.update({
        where: { walletAddress },
        data: { nonce: null },
      });

      // 7. Buat payload untuk JWT
      const payload = { sub: user.id, walletAddress: user.walletAddress };

      // 8. Buat dan kembalikan access token
      return {
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      // Menangkap error dari ethers.verifyMessage jika format signature salah
      throw new UnauthorizedException('Gagal memverifikasi tanda tangan.');
    }
  }
}

