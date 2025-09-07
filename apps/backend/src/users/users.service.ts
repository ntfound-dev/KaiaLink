// LOKASI FILE: apps/backend/src/users/users.service.ts
// ----------------------------------------------------

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  // Suntikkan PrismaService agar bisa berinteraksi dengan database
  constructor(private prisma: PrismaService) {}

  /**
   * Mencari atau membuat pengguna baru berdasarkan alamat wallet.
   * @param walletAddress Alamat wallet pengguna
   * @returns Objek Pengguna (User)
   */
  async findOrCreateByWalletAddress(walletAddress: string): Promise<User> {
    const lowercasedAddress = walletAddress.toLowerCase();
    
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: lowercasedAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: lowercasedAddress,
        },
      });
    }

    return user;
  }

  /**
   * Mencari satu pengguna berdasarkan alamat wallet.
   * @param walletAddress Alamat wallet
   * @returns Objek User atau null jika tidak ditemukan
   */
  async findOneByWalletAddress(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });
  }

  /**
   * Mendapatkan profil pengguna berdasarkan ID.
   * @param id ID Pengguna
   * @returns Objek User tanpa nonce
   */
  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    // Hapus nonce sebelum mengirim data ke client
    if (user) {
        const { nonce, ...result } = user;
        return result;
    }
    return null;
  }

  /**
   * Mengupdate nonce pengguna untuk keamanan setelah login berhasil.
   * @param userId ID Pengguna
   * @returns Objek User yang telah diupdate
   */
  async refreshNonce(userId: string): Promise<User> {
      return this.prisma.user.update({
          where: { id: userId },
          data: {
              // Membuat nonce baru yang acak
              nonce: Buffer.from(require('crypto').randomBytes(32)).toString('hex')
          }
      });
  }
}

