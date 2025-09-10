// src/indexer/indexer.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardsService } from '../leaderboards/leaderboards.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import Decimal from 'decimal.js';

const YOUR_CONTRACT_ABI = [
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

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private CONFIRMATIONS = parseInt(process.env.CONFIRMATIONS_REQUIRED || '6', 10);

  // cache decimals if you know underlying token addresses
  private decimalsCache = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private leaderboardsService: LeaderboardsService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.logger.log('Menginisialisasi Indexer Service...');
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const contractAddress = this.configService.get<string>('YOUR_CONTRACT_ADDRESS');

    if (!rpcUrl || !contractAddress) {
      this.logger.error('RPC_URL atau YOUR_CONTRACT_ADDRESS tidak disetel di .env. Indexer tidak akan berjalan.');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contract = new ethers.Contract(contractAddress, YOUR_CONTRACT_ABI, this.provider);
      this.listenToChainEvents();
      this.logger.log('IndexerService siap.');
    } catch (error) {
      this.logger.error('Gagal menginisialisasi koneksi Ethers.js', error);
    }
  }

  // ---------- Prisma helpers ----------
  private async alreadyProcessed(txHash: string, logIndex: number): Promise<boolean> {
    const rec = await this.prisma.eventProcessed.findUnique({
      where: { txHash_logIndex: { txHash, logIndex } } as any
    }).catch(()=>null);
    return !!rec;
  }

  private async markProcessed(
    txHash: string,
    logIndex: number,
    contractAddr: string,
    eventName: string,
    blockNumber: bigint,
    confirmed = false
  ) {
    await this.prisma.eventProcessed.create({
      data: { txHash, logIndex, contractAddr, eventName, blockNumber, confirmed }
    }).catch(err => {
      this.logger.warn('markProcessed failed', err);
    });
  }

  // ---------- Utility ----------
  private async hasEnoughConfirmations(blockNumber: number): Promise<boolean> {
    const head = await this.provider.getBlockNumber();
    return (head - blockNumber) >= this.CONFIRMATIONS;
  }

  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    if (!tokenAddress) return 18;
    if (this.decimalsCache.has(tokenAddress)) return this.decimalsCache.get(tokenAddress);
    try {
      const erc20 = new ethers.Contract(tokenAddress, ['function decimals() view returns (uint8)'], this.provider);
      const d = await erc20.decimals();
      const n = Number(d);
      this.decimalsCache.set(tokenAddress, n);
      return n;
    } catch (err) {
      this.logger.warn(`Gagal ambil decimals untuk ${tokenAddress}, fallback 18`);
      this.decimalsCache.set(tokenAddress, 18);
      return 18;
    }
  }

  private formatAmountDecimal(raw: ethers.BigNumberish, decimals = 18): Decimal {
    const s = ethers.formatUnits(raw, decimals); // string
    return new Decimal(s);
  }

  // Stub: implement price oracle (Chainlink/offchain)
  private async getPriceUsd(tokenAddress: string | null, timestampSec: number): Promise<Decimal | null> {
    // TODO: integrasikan source harga. Return Decimal or null if unknown.
    return null;
  }

  // ---------- Event listeners ----------
  private listenToChainEvents() {
    this.logger.log(`Mulai mendengarkan event dari kontrak di alamat ${this.contract.address}`);

    // Use rest args: event args then last arg is “event”
    this.contract.on('Swapped', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeProcessSwapEvent(args.slice(0, -1), event); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('Staked', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeUpdateStaking(args.slice(0, -1), event, true); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('Unstaked', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeUpdateStaking(args.slice(0, -1), event, false); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('Harvested', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeProcessHarvest(args.slice(0, -1), event); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('Supplied', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeLendSupply(args.slice(0, -1), event, true); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('Withdrawn', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeLendSupply(args.slice(0, -1), event, false); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('Borrowed', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeLendBorrow(args.slice(0, -1), event, true); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('Repaid', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeLendBorrow(args.slice(0, -1), event, false); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('LiquidityAdded', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeAmmLiquidity(args.slice(0, -1), event, true); } catch(e){ this.logger.error(e); }
    });

    this.contract.on('LiquidityRemoved', async (...args: any[]) => {
      const event = args[args.length - 1];
      try { await this.safeAmmLiquidity(args.slice(0, -1), event, false); } catch(e){ this.logger.error(e); }
    });
  }

  // ---------- Safe processors ----------
  private async safeProcessSwapEvent(args: any[], event: any) {
    // args: user, amountIn, amountOut
    const [user, rawAmountIn] = args;
    const txHash = event.transactionHash;
    const logIndex = Number(event.logIndex);
    const blockNumber = Number(event.blockNumber);

    if (await this.alreadyProcessed(txHash, logIndex)) return;
    if (!await this.hasEnoughConfirmations(blockNumber)) {
      this.logger.log(`Swap ${txHash}:${logIndex} belum konfirmasi cukup, dilewati.`);
      return;
    }

    // WARNING: if token decimals unknown, SC should emit token address.
    const decimals = 18;
    const amt = this.formatAmountDecimal(rawAmountIn, decimals);

    // price convert optional
    const block = await this.provider.getBlock(blockNumber);
    const price = await this.getPriceUsd(null, block.timestamp);
    const usd = price ? amt.mul(price) : amt; // if price null we keep token units

    const userId = await this.findOrCreateUserAndProfile(user);
    // prisma increment supports strings or Decimal
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

  // ---------- Small helper: create user/profile ----------
  private async findOrCreateUserAndProfile(walletAddress: string) {
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
