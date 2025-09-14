// src/indexer/indexer.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardsService } from '../leaderboards/leaderboards.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import Decimal from 'decimal.js';

// ABI untuk event yang relevan dari kontrak DeFi
const DEFI_CONTRACT_ABI = [
  "event Swapped(address indexed user, uint256 amountIn, uint256 amountOut)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event Harvested(address indexed user, uint256 rewardAmount)",
  "event Supplied(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event Borrowed(address indexed user, uint256 amount)",
  "event Repaid(address indexed user, uint256 amount)",
  "event LiquidityAdded(address indexed user, uint256 amountA, uint256 amountB)",
  "event LiquidityRemoved(address indexed user, uint256 amountA, uint256 amountB)",
];

// ABI untuk event mint dari kontrak SBT
const SBT_CONTRACT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private provider: ethers.JsonRpcProvider;
  private defiContract: ethers.Contract;
  private sbtContract: ethers.Contract;
  private CONFIRMATIONS = parseInt(process.env.CONFIRMATIONS_REQUIRED || '6', 10);

  private decimalsCache = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private leaderboardsService: LeaderboardsService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.logger.log('Menginisialisasi Indexer Service...');
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const defiContractAddress = this.configService.get<string>('YOUR_CONTRACT_ADDRESS');
    const sbtContractAddress = this.configService.get<string>('SBT_CONTRACT_ADDRESS');

    if (!rpcUrl) {
      this.logger.error('RPC_URL tidak disetel di .env. Indexer tidak akan berjalan.');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      if (defiContractAddress) {
        this.defiContract = new ethers.Contract(defiContractAddress, DEFI_CONTRACT_ABI, this.provider);
      } else {
        this.logger.warn('YOUR_CONTRACT_ADDRESS tidak disetel. Indexer DeFi tidak akan berjalan.');
      }

      if (sbtContractAddress) {
        this.sbtContract = new ethers.Contract(sbtContractAddress, SBT_CONTRACT_ABI, this.provider);
      } else {
        this.logger.warn('SBT_CONTRACT_ADDRESS tidak disetel. Indexer SBT tidak akan berjalan.');
      }

      this.listenToChainEvents();
      this.logger.log('IndexerService siap.');
    } catch (error) {
      this.logger.error('Gagal menginisialisasi koneksi Ethers.js', error);
    }
  }

  // ---------- Prisma Helpers ----------
  private async alreadyProcessed(txHash: string, logIndex: number): Promise<boolean> {
    const rec = await this.prisma.eventProcessed.findUnique({
      where: { txHash_logIndex: { txHash, logIndex } } as any,
    }).catch(() => null);
    return !!rec;
  }

  private async markProcessed(
    txHash: string,
    logIndex: number,
    contractAddr: string,
    eventName: string,
    blockNumber: bigint,
    confirmed = true
  ) {
    await this.prisma.eventProcessed.create({
      data: { txHash, logIndex, contractAddr, eventName, blockNumber, confirmed },
    }).catch(err => {
      this.logger.warn(`Gagal menandai event sebagai terproses: ${txHash}:${logIndex}`, err.message);
    });
  }

  // ---------- Utility ----------
  private async hasEnoughConfirmations(blockNumber: number): Promise<boolean> {
    const latestBlock = await this.provider.getBlockNumber();
    return (latestBlock - blockNumber) >= this.CONFIRMATIONS;
  }
  
  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    if (!tokenAddress) return 18;
    if (this.decimalsCache.has(tokenAddress)) {
      return this.decimalsCache.get(tokenAddress)!;
    }
    try {
      const erc20 = new ethers.Contract(tokenAddress, ['function decimals() view returns (uint8)'], this.provider);
      const d = await erc20.decimals();
      const n = Number(d);
      this.decimalsCache.set(tokenAddress, n);
      return n;
    } catch (err) {
      this.logger.warn(`Gagal ambil decimals untuk ${tokenAddress}, menggunakan default 18`);
      this.decimalsCache.set(tokenAddress, 18);
      return 18;
    }
  }

  private formatAmountDecimal(raw: ethers.BigNumberish, decimals = 18): Decimal {
    const s = ethers.formatUnits(raw, decimals);
    return new Decimal(s);
  }

  private async getPriceUsd(tokenAddress: string | null, timestampSec: number): Promise<Decimal | null> {
    // TODO: integrasikan source harga. Return Decimal or null if unknown.
    return null;
  }

  // ---------- Event Listeners ----------
  private listenToChainEvents() {
    if (this.defiContract) {
      this.logger.log(`Mulai mendengarkan event dari kontrak DeFi di alamat ${this.defiContract.address}`);
      
      this.defiContract.on('Swapped', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeProcessSwapEvent(args.slice(0, -1), event); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('Staked', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeUpdateStaking(args.slice(0, -1), event, true); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('Unstaked', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeUpdateStaking(args.slice(0, -1), event, false); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('Harvested', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeProcessHarvest(args.slice(0, -1), event); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('Supplied', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeLendSupply(args.slice(0, -1), event, true); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('Withdrawn', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeLendSupply(args.slice(0, -1), event, false); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('Borrowed', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeLendBorrow(args.slice(0, -1), event, true); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('Repaid', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeLendBorrow(args.slice(0, -1), event, false); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('LiquidityAdded', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeAmmLiquidity(args.slice(0, -1), event, true); } catch(e){ this.logger.error(e); }
      });
      this.defiContract.on('LiquidityRemoved', async (...args: any[]) => {
        const event = args[args.length - 1];
        try { await this.safeAmmLiquidity(args.slice(0, -1), event, false); } catch(e){ this.logger.error(e); }
      });
    }

    if (this.sbtContract) {
      this.logger.log(`Mulai mendengarkan event 'Transfer' dari kontrak SBT di ${this.sbtContract.address}`);
      this.sbtContract.on('Transfer', async (...args: any[]) => {
        const event = args[args.length - 1];
        try {
          if (args[0] === ethers.ZeroAddress) {
            await this.safeProcessSbtMint(args.slice(0, -1), event);
          }
        } catch (e) {
          this.logger.error(`Gagal memproses event mint SBT: ${e.message}`, e.stack);
        }
      });
    }
  }

  // ---------- Event Processors ----------

  private async safeProcessSbtMint(args: any[], event: any) {
    const [from, to, tokenId] = args;
    const userAddress = to;
    const sbtTokenId = BigInt(tokenId.toString());
    const txHash = event.transactionHash;
    const logIndex = Number(event.logIndex);
    const blockNumber = Number(event.blockNumber);

    this.logger.log(`Mendeteksi event mint SBT untuk ${userAddress} dengan tokenId ${sbtTokenId} di blok ${blockNumber}`);
    if (await this.alreadyProcessed(txHash, logIndex)) return;
    if (!await this.hasEnoughConfirmations(blockNumber)) return;

    const userId = await this.findOrCreateUserAndProfile(userAddress);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hasSbt: true,
        sbtTokenId: sbtTokenId,
        sbtContractAddress: event.address.toLowerCase(),
      },
    });

    await this.markProcessed(txHash, logIndex, event.address, 'SbtMinted', BigInt(blockNumber), true);
    this.logger.log(`✅ Berhasil memproses Mint SBT ${txHash}:${logIndex} untuk user=${userAddress}`);
  }

  private async safeProcessSwapEvent(args: any[], event: any) {
    const [user, rawAmountIn] = args;
    const txHash = event.transactionHash;
    const logIndex = Number(event.logIndex);
    const blockNumber = Number(event.blockNumber);
    if (await this.alreadyProcessed(txHash, logIndex)) return;
    if (!await this.hasEnoughConfirmations(blockNumber)) return;

    const decimals = 18;
    const amt = this.formatAmountDecimal(rawAmountIn, decimals);
    const block = await this.provider.getBlock(blockNumber);
    const price = await this.getPriceUsd(null, block.timestamp);
    const usd = price ? amt.mul(price) : amt;

    const userId = await this.findOrCreateUserAndProfile(user);
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalSwapVolume: { increment: usd.toString() },
        swapCount: { increment: 1 },
        lastUpdatedBlock: BigInt(blockNumber),
      }
    });
    await this.markProcessed(txHash, logIndex, event.address, 'Swapped', BigInt(blockNumber), true);
    await this.leaderboardsService.updateLeaderboardEntry('SWAP_VOLUME', userId, usd.toString());
    this.logger.log(`Processed Swap ${txHash}:${logIndex} user=${user}`);
  }

  private async safeUpdateStaking(args: any[], event: any, isStake: boolean) {
    const [user, rawAmount] = args;
    const txHash = event.transactionHash;
    const logIndex = Number(event.logIndex);
    const blockNumber = Number(event.blockNumber);
    if (await this.alreadyProcessed(txHash, logIndex)) return;
    if (!await this.hasEnoughConfirmations(blockNumber)) return;

    const amt = this.formatAmountDecimal(rawAmount, 18);
    const signed = isStake ? amt : amt.neg();
    const userId = await this.findOrCreateUserAndProfile(user);
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalStakingVolume: { increment: signed.toString() },
        lastUpdatedBlock: BigInt(blockNumber),
      }
    });
    await this.markProcessed(txHash, logIndex, event.address, isStake ? 'Staked' : 'Unstaked', BigInt(blockNumber), true);
    this.logger.log(`${isStake ? 'Staked' : 'Unstaked'} processed ${txHash}:${logIndex}`);
  }

  private async safeProcessHarvest(args: any[], event: any) {
    const [user] = args;
    const txHash = event.transactionHash;
    const logIndex = Number(event.logIndex);
    const blockNumber = Number(event.blockNumber);
    if (await this.alreadyProcessed(txHash, logIndex)) return;
    if (!await this.hasEnoughConfirmations(blockNumber)) return;

    const userId = await this.findOrCreateUserAndProfile(user);
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        harvestCount: { increment: 1 },
        lastUpdatedBlock: BigInt(blockNumber)
      }
    });
    await this.markProcessed(txHash, logIndex, event.address, 'Harvested', BigInt(blockNumber), true);
    this.logger.log(`Harvest processed ${txHash}:${logIndex} user=${user}`);
  }

  private async safeLendSupply(args: any[], event: any, isSupply: boolean) {
    const [user, rawAmount] = args;
    const txHash = event.transactionHash;
    const logIndex = Number(event.logIndex);
    const blockNumber = Number(event.blockNumber);
    if (await this.alreadyProcessed(txHash, logIndex)) return;
    if (!await this.hasEnoughConfirmations(blockNumber)) return;

    const amt = this.formatAmountDecimal(rawAmount, 18);
    const signed = isSupply ? amt : amt.neg();
    const userId = await this.findOrCreateUserAndProfile(user);
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalLendSupplyVolume: { increment: signed.toString() },
        lastUpdatedBlock: BigInt(blockNumber)
      }
    });
    await this.markProcessed(txHash, logIndex, event.address, isSupply ? 'Supplied' : 'Withdrawn', BigInt(blockNumber), true);
    this.logger.log(`Lend supply processed ${txHash}:${logIndex}`);
  }

  private async safeLendBorrow(args: any[], event: any, isBorrow: boolean) {
    const [user, rawAmount] = args;
    const txHash = event.transactionHash;
    const logIndex = Number(event.logIndex);
    const blockNumber = Number(event.blockNumber);
    if (await this.alreadyProcessed(txHash, logIndex)) return;
    if (!await this.hasEnoughConfirmations(blockNumber)) return;

    const amt = this.formatAmountDecimal(rawAmount, 18);
    const signed = isBorrow ? amt : amt.neg();
    const userId = await this.findOrCreateUserAndProfile(user);
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalLendBorrowVolume: { increment: signed.toString() },
        lastUpdatedBlock: BigInt(blockNumber)
      }
    });
    await this.markProcessed(txHash, logIndex, event.address, isBorrow ? 'Borrowed' : 'Repaid', BigInt(blockNumber), true);
    this.logger.log(`Lend borrow processed ${txHash}:${logIndex}`);
  }

  private async safeAmmLiquidity(args: any[], event: any, isAdd: boolean) {
    const [user, rawA, rawB] = args;
    const txHash = event.transactionHash;
    const logIndex = Number(event.logIndex);
    const blockNumber = Number(event.blockNumber);
    if (await this.alreadyProcessed(txHash, logIndex)) return;
    if (!await this.hasEnoughConfirmations(blockNumber)) return;

    const a = this.formatAmountDecimal(rawA, 18);
    const b = this.formatAmountDecimal(rawB, 18);
    const total = a.plus(b);
    const signed = isAdd ? total : total.neg();
    const userId = await this.findOrCreateUserAndProfile(user);
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalAmmLiquidityVolume: { increment: signed.toString() },
        lastUpdatedBlock: BigInt(blockNumber)
      }
    });
    await this.markProcessed(txHash, logIndex, event.address, isAdd ? 'LiquidityAdded' : 'LiquidityRemoved', BigInt(blockNumber), true);
    this.logger.log(`AMM ${isAdd ? 'add' : 'remove'} processed ${txHash}:${logIndex}`);
  }

  // ---------- User Helper ----------
  private async findOrCreateUserAndProfile(walletAddress: string): Promise<string> {
    const lowercasedAddress = walletAddress.toLowerCase();
    const user = await this.prisma.user.upsert({
      where: { walletAddress: lowercasedAddress },
      update: {},
      create: { walletAddress: lowercasedAddress },
    });
    await this.prisma.deFiProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    return user.id;
  }
}