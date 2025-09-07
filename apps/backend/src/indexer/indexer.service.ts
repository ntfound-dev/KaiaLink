// LOKASI FILE: apps/backend/src/indexer/indexer.service.ts
// --------------------------------------------------------

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';

// Contoh ABI (Application Binary Interface) sederhana dari sebuah event
// Di aplikasi nyata, ini akan menjadi ABI dari smart contract Anda.
const simpleContractAbi = [
  'event OnChainAction(address indexed user, uint256 points)',
];

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private provider: ethers.WebSocketProvider;
  private contract: ethers.Contract;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Metode ini akan dijalankan secara otomatis saat modul diinisialisasi.
   */
  onModuleInit() {
    this.logger.log('Menginisialisasi Indexer Service...');
    this.startListening();
  }

  private startListening() {
    const providerUrl = this.configService.get<string>('RPC_URL');
    const contractAddress = this.configService.get<string>('YOUR_CONTRACT_ADDRESS');

    if (!providerUrl || !contractAddress) {
      this.logger.error('RPC_URL atau YOUR_CONTRACT_ADDRESS tidak disetel di .env. Indexer tidak akan berjalan.');
      return;
    }

    try {
      this.provider = new ethers.WebSocketProvider(providerUrl);
      this.contract = new ethers.Contract(contractAddress, simpleContractAbi, this.provider);

      this.logger.log(`Terhubung ke RPC dan mendengarkan event di contract ${contractAddress}`);

      // Mendengarkan event 'OnChainAction'
      this.contract.on('OnChainAction', (user, points, event) => {
        this.handleOnChainActionEvent(user, points, event);
      });

      // Menangani koneksi yang terputus
      this.provider.on('close', () => {
          this.logger.warn('Koneksi WebSocket RPC terputus. Mencoba menghubungkan kembali...');
          // Implementasikan logika retry di sini
      });

    } catch (error) {
      this.logger.error('Gagal memulai indexer:', error);
    }
  }

  /**
   * Menangani event yang diterima dari blockchain.
   */
  private async handleOnChainActionEvent(userAddress: string, points: ethers.BigNumberish, event: any) {
    const pointsToAdd = Number(points);
    const lowercasedAddress = userAddress.toLowerCase();
    
    this.logger.log(`Event OnChainAction terdeteksi untuk user: ${lowercasedAddress}, poin: ${pointsToAdd}`);

    try {
      // Cari pengguna di database berdasarkan alamat wallet
      const user = await this.prisma.user.findUnique({
        where: { walletAddress: lowercasedAddress },
      });

      if (user) {
        // Jika pengguna ada, tambahkan poinnya
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            points: {
              increment: pointsToAdd,
            },
          },
        });
        this.logger.log(`Berhasil menambahkan ${pointsToAdd} poin untuk user ${user.id}`);
      } else {
        // Jika pengguna belum ada, bisa juga dibuatkan akun baru di sini
        this.logger.warn(`User dengan wallet ${lowercasedAddress} tidak ditemukan di database.`);
      }
    } catch (error) {
      this.logger.error(`Gagal memproses event untuk tx: ${event.log.transactionHash}`, error);
    }
  }
}
