import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { UpdateUserDto } from '../common/dtos/update-user.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private sanitizeUser(user: User): Omit<User, 'nonce'> {
    if (!user) return null;
    const { nonce, ...result } = user;
    return result;
  }

  // ... (method findOrCreateByWalletAddress dan findOneByWalletAddress tetap sama) ...
  async findOrCreateByWalletAddress(walletAddress: string): Promise<User> {
    const lowercasedAddress = walletAddress.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: lowercasedAddress },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress: lowercasedAddress },
      });
    }
    return user;
  }
  async findOneByWalletAddress(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });
  }


  /**
   * REVISI: Nama diganti kembali menjadi `getProfile` agar sinkron dengan Controller.
   * Mendapatkan profil publik pengguna berdasarkan ID.
   */
  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }
    
    return this.sanitizeUser(user);
  }

  async refreshNonce(userId: string): Promise<User> {
      return this.prisma.user.update({
          where: { id: userId },
          data: {
              nonce: crypto.randomBytes(32).toString('hex')
          }
      });
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.telegramHandle !== undefined) {
      updateData.telegramHandle = data.telegramHandle;
    }
    if (data.discordId !== undefined) {
      updateData.discordId = data.discordId;
    }
    if (data.twitterHandle !== undefined) {
      updateData.twitterHandle = data.twitterHandle;
    }
    if (data.lineId !== undefined) {
      updateData.lineId = data.lineId;
    }

    if (Object.keys(updateData).length === 0) {
      return this.getProfile(userId);
    }
    
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.sanitizeUser(updatedUser);
  }
}
