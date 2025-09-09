// LOKASI FILE: apps/backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getSignMessage(walletAddress: string): Promise<{ message: string }> {
    const nonce = uuidv4();
    const message = `Selamat datang di KaiaLink! Silakan tanda tangani pesan ini untuk login. Nonce: ${nonce}`;
    
    // --- DEBUGGING ---
    // Mencatat nonce yang akan disimpan ke database
    console.log(`[SIGNIN] Untuk ${walletAddress}, menyimpan nonce: ${nonce}`);
    // --- AKHIR DEBUGGING ---

    await this.prisma.user.upsert({
      where: { walletAddress },
      update: { nonce },
      create: { walletAddress, nonce },
    });
    return { message };
  }

  async verifySignature(
    walletAddress: string,
    signature: string,
  ): Promise<{ accessToken: string }> {

    // --- DEBUGGING ---
    console.log("\n--- MEMULAI VERIFIKASI ---");
    console.log(`[VERIFY] Alamat diterima: ${walletAddress}`);
    console.log(`[VERIFY] Signature diterima: ${signature}`);
    // --- AKHIR DEBUGGING ---

    const user = await this.prisma.user.findUnique({
     where: { walletAddress },
    });

    // --- DEBUGGING ---
    // Mencatat user yang ditemukan dari database
    console.log(`[VERIFY] User dari DB:`, user);
    // --- AKHIR DEBUGGING ---

    if (!user || !user.nonce) {
      console.error("[VERIFY] KESALAHAN: User tidak ditemukan atau nonce di DB kosong.");
      throw new UnauthorizedException('User tidak ditemukan atau nonce tidak valid.');
    }
    
    // Ini adalah pesan yang server harapkan, berdasarkan nonce dari database
    const expectedMessage = `Selamat datang di KaiaLink! Silakan tanda tangani pesan ini untuk login. Nonce: ${user.nonce}`;
    
    // --- DEBUGGING ---
    console.log(`[VERIFY] Pesan yang diharapkan server: "${expectedMessage}"`);
    // --- AKHIR DEBUGGING ---

    try {
      const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);

      // --- DEBUGGING ---
      console.log(`[VERIFY] Alamat hasil verifikasi: ${recoveredAddress}`);
      // --- AKHIR DEBUGGING ---

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.error("[VERIFY] KESALAHAN: Alamat hasil verifikasi tidak cocok.");
        throw new UnauthorizedException('Tanda tangan tidak valid.');
      }
      
      // Jika berhasil, hapus nonce agar tidak bisa dipakai lagi
      await this.prisma.user.update({
        where: { walletAddress },
        data: { nonce: null },
      });
      
      const payload = { sub: user.id, walletAddress: user.walletAddress };
      
      console.log("[VERIFY] SUKSES! Membuat token JWT.");
      console.log("--- SELESAI VERIFIKASI ---\n");

      return {
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      console.error("[VERIFY] KESALAHAN saat proses verifikasi:", error.message);
      throw new UnauthorizedException('Gagal memverifikasi tanda tangan.');
    }
  }
}
