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
    const user = await this.usersService.findOneByWalletAddress(walletAddress);
    if (!user || !user.nonce) {
      throw new UnauthorizedException('User tidak ditemukan atau nonce tidak valid.');
    }
    const message = `Selamat datang di KaiaLink! Silakan tanda tangani pesan ini untuk login. Nonce: ${user.nonce}`;
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Tanda tangan tidak valid.');
      }
      await this.prisma.user.update({
        where: { walletAddress },
        data: { nonce: null },
      });
      const payload = { sub: user.id, walletAddress: user.walletAddress };
      return {
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new UnauthorizedException('Gagal memverifikasi tanda tangan.');
    }
  }
}