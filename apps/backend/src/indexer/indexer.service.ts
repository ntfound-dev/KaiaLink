import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardsService } from '../leaderboards/leaderboards.service';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, EventLog, Log } from 'ethers';
import Decimal from 'decimal.js';
import axios from 'axios';

// --- ABIs ---
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
const SBT_CONTRACT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];
// ---

type EventProcessor = (args: readonly any[], event: EventLog) => Promise<void>;
type PriceCacheEntry = { price: Decimal; timestamp: number };

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private provider!: ethers.JsonRpcProvider | ethers.WebSocketProvider;
  private readonly CONFIRMATIONS: number;

  private decimalsCache = new Map<string, number>();
  private priceCache = new Map<string, PriceCacheEntry>();
  private readonly PRICE_CACHE_DURATION_MS = 5 * 60 * 1000;
  private readonly cmcApiKey?: string;
  private readonly tokenSymbolMap = new Map<string, string>();
  private pollIntervalMs: number;
  private pollBackfillBlocks: number;
  private pollChunkSize: number;
  private lastScannedBlock = new Map<string, number>();
  private pollingHandles: NodeJS.Timeout[] = [];
  private _contractPollers = new Map<string, { iface: ethers.Interface; eventMap: Record<string, EventProcessor> }>();

  constructor(
    private prisma: PrismaService,
    private leaderboardsService: LeaderboardsService,
    private configService: ConfigService,
  ) {
    this.CONFIRMATIONS = parseInt(this.configService.get<string>('CONFIRMATIONS_REQUIRED', '6'), 10);
    this.cmcApiKey = this.configService.get<string>('COINMARKETCAP_API_KEY');
    if (!this.cmcApiKey) {
      this.logger.warn('COINMARKETCAP_API_KEY tidak ditemukan. Harga USD tidak akan akurat.');
    }
    this.pollIntervalMs = parseInt(this.configService.get<string>('EVENT_POLL_INTERVAL_MS', '5000'), 10);
    this.pollBackfillBlocks = parseInt(this.configService.get<string>('EVENT_POLL_BACKFILL_BLOCKS', '50'), 10);
    this.pollChunkSize = parseInt(this.configService.get<string>('EVENT_POLL_CHUNK_BLOCKS', '500'), 10);
    this.initializeTokenSymbols();
  }
  
  private initializeTokenSymbols() {
    this.tokenSymbolMap.set('0x025038a4c99eb436b8425ffa079c47af4e'.toLowerCase(), 'LINK');
    this.tokenSymbolMap.set('0xd7df5b2707d434096b21d508452664258d310ac0'.toLowerCase(), 'WETH');
    this.tokenSymbolMap.set('0xc78ec57995863e088c1185a1ef8a0d64fce0cb7d'.toLowerCase(), 'USDT');
    this.tokenSymbolMap.set('0xbb283a92f03dfdd913caf9dce5814f70f4b67dac'.toLowerCase(), 'KLAY');
  }

  onModuleInit() {
    this.logger.log('Menginisialisasi Indexer Service...');
    const rpcUrl = this.configService.get<string>('RPC_URL') || this.configService.get<string>('PUBLIC_RPC_URL') || 'https://public-en-kairos.node.kaia.io';

    try {
      this.provider = this.createProvider(rpcUrl);
      this.logger.log(`Terkoneksi ke RPC: ${rpcUrl}`);
      this.listenToChainEvents();
      this.startLogPoller();
      this.logger.log('IndexerService siap dan mendengarkan event (polling mode).');
    } catch (error) {
      this.logger.error('Gagal menginisialisasi koneksi Ethers.js', (error as any).message || error);
      throw error;
    }
  }

  onModuleDestroy() {
    for (const h of this.pollingHandles) clearInterval(h);
    this.pollingHandles = [];
    this.logger.log('IndexerService shutdown: polling stopped.');
  }
  
  private createProvider(rpcUrl: string): ethers.JsonRpcProvider | ethers.WebSocketProvider {
    if (rpcUrl.startsWith('ws://') || rpcUrl.startsWith('wss://')) {
      this.logger.log('Using WebSocketProvider');
      return new ethers.WebSocketProvider(rpcUrl);
    }
    const kasAccessKey = this.configService.get<string>('KAS_ACCESS_KEY') || this.configService.get<string>('KLAYTN_ACCESS_KEY');
    const kasSecret = this.configService.get<string>('KAS_SECRET') || this.configService.get<string>('KLAYTN_SECRET');
    if (kasAccessKey && kasSecret && rpcUrl.includes('node-api.klaytnapi.com')) {
      const encoded = Buffer.from(`${kasAccessKey}:${kasSecret}`).toString('base64');
      const auth = `Basic ${encoded}`;
      const cleanUrl = rpcUrl.split('?')[0];
      const connection = {
        url: cleanUrl,
        headers: {
          Authorization: auth,
          'x-chain-id': this.configService.get<string>('CHAIN_ID', '1001'),
          'Content-Type': 'application/json',
        },
      } as any;
      return new ethers.JsonRpcProvider(connection);
    }
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private listenToChainEvents() {
    const defiEventMap: Record<string, EventProcessor> = {
      'Swapped': (args, event) => this._processSwapEvent(args, event),
      'Staked': (args, event) => this._updateStaking(args, event, true),
      'Unstaked': (args, event) => this._updateStaking(args, event, false),
      'Harvested': (args, event) => this._processHarvest(args, event),
      'Supplied': (args, event) => this._updateLendSupply(args, event, true),
      'Withdrawn': (args, event) => this._updateLendSupply(args, event, false),
      'Borrowed': (args, event) => this._updateLendBorrow(args, event, true),
      'Repaid': (args, event) => this._updateLendBorrow(args, event, false),
      'LiquidityAdded': (args, event) => this._updateAmmLiquidity(args, event, true),
      'LiquidityRemoved': (args, event) => this._updateAmmLiquidity(args, event, false),
    };
    this.attachListenersToContracts('AMM_PAIR_ADDRESSES', DEFI_CONTRACT_ABI, defiEventMap);
    this.attachListenersToContracts('STAKING_CONTRACT_ADDRESSES', DEFI_CONTRACT_ABI, defiEventMap);
    this.attachListenersToContracts('LENDING_CTOKEN_ADDRESSES', DEFI_CONTRACT_ABI, defiEventMap);
    const sbtEventMap: Record<string, EventProcessor> = {
      'Transfer': (args, event) => {
        if (args[0] === ethers.ZeroAddress) {
          return this._processSbtMint(args, event);
        }
        return Promise.resolve();
      }
    };
    this.attachListenersToContracts('SBT_CONTRACT_ADDRESSES', SBT_CONTRACT_ABI, sbtEventMap);
  }

  private attachListenersToContracts(configKey: string, abi: any[], eventMap: Record<string, EventProcessor>) {
    const addressesStr = this.configService.get<string>(configKey);
    if (!addressesStr) {
      this.logger.warn(`Tidak ada alamat yang disetel untuk ${configKey}, listener dilewati.`);
      return;
    }
    const addresses = addressesStr.split(',').map(a => a.trim().toLowerCase());
    const iface = new ethers.Interface(abi);
    for (const address of addresses) {
      if (!ethers.isAddress(address)) {
        this.logger.error(`Alamat tidak valid di ${configKey}: ${address}`);
        continue;
      }
      this._contractPollers.set(address, { iface, eventMap });
      this.logger.log(`Mendaftarkan kontrak untuk polling events: ${address}`);
    }
  }

  private startLogPoller() {
    if (this._contractPollers.size === 0) {
      this.logger.debug('Tidak ada kontrak untuk dipolling. Lewati startLogPoller.');
      return;
    }
    const poller = async () => {
      try {
        const latestBlock = await this.provider.getBlockNumber();
        const safeLatestBlock = latestBlock - 3;
        for (const [address, { iface, eventMap }] of this._contractPollers.entries()) {
          const last = this.lastScannedBlock.get(address) ?? Math.max(0, safeLatestBlock - this.pollBackfillBlocks);
          let fromBlock = last + 1;
          const toBlock = safeLatestBlock;
          if (fromBlock > toBlock) continue;
          while (fromBlock <= toBlock) {
            const chunkTo = Math.min(fromBlock + this.pollChunkSize - 1, toBlock);
            try {
              const logs: Log[] = await this.provider.getLogs({ address, fromBlock, toBlock: chunkTo });
              for (const log of logs) {
                let parsed;
                try {
                  parsed = iface.parseLog(log);
                } catch (e) {
                  continue;
                }
                if (!parsed) continue;
                const eventName = parsed.name;
                const processor = eventMap[eventName];
                if (!processor) continue;
                const event: EventLog = {
                  blockNumber: log.blockNumber,
                  transactionHash: log.transactionHash,
                  index: log.index,
                  address: log.address,
                  args: parsed.args,
                  blockHash: log.blockHash,
                  data: log.data,
                  removed: log.removed,
                  topics: log.topics,
                  transactionIndex: log.transactionIndex,
                  eventName: parsed.name,
                  signature: parsed.signature,
                } as any;
                try {
                  if (await this.alreadyProcessed(log.transactionHash, log.index)) continue;
                  if (!(await this.hasEnoughConfirmations(log.blockNumber))) continue;
                  const argsArray = Array.from(parsed.args) as readonly any[];
                  await processor(argsArray, event);
                } catch (err) {
                  const msg = (err && (err as any).message) ? (err as any).message : String(err);
                  this.logger.error(`Gagal memproses polled event ${address} ${eventName}: ${msg}`);
                }
              }
              this.lastScannedBlock.set(address, chunkTo);
            } catch (err) {
              const msg = (err && (err as any).message) ? (err as any).message : String(err);
              this.logger.warn(`getLogs error for ${address} [${fromBlock}-${chunkTo}]: ${msg}`);
              break;
            }
            fromBlock = chunkTo + 1;
          }
        }
      } catch (err) {
        const msg = (err && (err as any).message) ? (err as any).message : String(err);
        this.logger.warn(`Poller encountered error: ${msg}`);
      }
    };
    poller().catch(e => this.logger.warn('Initial poll failed: ' + (e as any).message));
    const handle = setInterval(poller, this.pollIntervalMs);
    this.pollingHandles.push(handle);
    this.logger.log(`Event poller started (interval ${this.pollIntervalMs} ms, chunk ${this.pollChunkSize} blocks)`);
  }
  
  // ===================================================================================
  // == EVENT PROCESSORS DENGAN PEMBARUAN LEADERBOARD & TVL GLOBAL
  // ===================================================================================

  private async _processSwapEvent(args: readonly any[], event: EventLog) {
    const [user, rawAmountIn] = args;
    const { transactionHash: txHash, index: logIndex, blockNumber, address } = event;
    const decimals = await this.getTokenDecimals(address);
    const amt = this.formatAmountDecimal(rawAmountIn, decimals);
    const price = await this.getPriceUsd(address);
    const usd = price ? amt.mul(price) : amt;
    const userId = await this.findOrCreateUserAndProfile(user);

    // 1. Perbarui profil pengguna untuk leaderboard
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalSwapVolume: { increment: usd.toString() },
        swapCount: { increment: 1 },
        lastUpdatedBlock: BigInt(blockNumber),
      },
    });

    // 2. Perbarui leaderboard
    await this.leaderboardsService.updateLeaderboardEntry('SWAP_VOLUME', userId, usd.toString());
    
    await this.markProcessed(txHash, logIndex, address, 'Swapped', BigInt(blockNumber));
    this.logger.log(`✅ Berhasil memproses Swap [${txHash}:${logIndex}] user=${user}`);
  }

  private async _updateStaking(args: readonly any[], event: EventLog, isStake: boolean) {
    const [user, rawAmount] = args;
    const { transactionHash: txHash, index: logIndex, blockNumber, address } = event;
    const eventName = isStake ? 'Staked' : 'Unstaked';
    const decimals = await this.getTokenDecimals(address);
    const amt = this.formatAmountDecimal(rawAmount, decimals);
    const signed = isStake ? amt : amt.neg();
    const userId = await this.findOrCreateUserAndProfile(user);

    // 1. Perbarui profil pengguna untuk leaderboard
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalStakingVolume: { increment: signed.toString() },
        lastUpdatedBlock: BigInt(blockNumber),
      }
    });

    // 2. PERBARUI TVL GLOBAL SECARA REAL-TIME
    await this.prisma.platformAnalytics.upsert({
      where: { category: 'STAKING' },
      update: { totalTokens: { increment: signed.toString() } },
      create: { category: 'STAKING', totalTokens: signed.toString() },
    });
    
    await this.markProcessed(txHash, logIndex, address, eventName, BigInt(blockNumber));
    this.logger.log(`✅ Berhasil memproses ${eventName} [${txHash}:${logIndex}]`);
  }
  
  private async _updateLendSupply(args: readonly any[], event: EventLog, isSupply: boolean) {
    const [user, rawAmount] = args;
    const { transactionHash: txHash, index: logIndex, blockNumber, address } = event;
    const eventName = isSupply ? 'Supplied' : 'Withdrawn';
    const decimals = await this.getTokenDecimals(address);
    const amt = this.formatAmountDecimal(rawAmount, decimals);
    const signed = isSupply ? amt : amt.neg();
    const userId = await this.findOrCreateUserAndProfile(user);

    // 1. Perbarui profil pengguna untuk leaderboard
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalLendSupplyVolume: { increment: signed.toString() },
        lastUpdatedBlock: BigInt(blockNumber)
      }
    });

    // 2. PERBARUI TVL GLOBAL SECARA REAL-TIME
    await this.prisma.platformAnalytics.upsert({
      where: { category: 'LENDING_SUPPLY' },
      update: { totalTokens: { increment: signed.toString() } },
      create: { category: 'LENDING_SUPPLY', totalTokens: signed.toString() },
    });
    
    await this.markProcessed(txHash, logIndex, address, eventName, BigInt(blockNumber));
    this.logger.log(`✅ Berhasil memproses ${eventName} [${txHash}:${logIndex}]`);
  }
  
  private async _updateAmmLiquidity(args: readonly any[], event: EventLog, isAdd: boolean) {
    const [user, rawA, rawB] = args;
    const { transactionHash: txHash, index: logIndex, blockNumber, address } = event;
    const eventName = isAdd ? 'LiquidityAdded' : 'LiquidityRemoved';
    const decimals = await this.getTokenDecimals(address);
    const a = this.formatAmountDecimal(rawA, decimals);
    const b = this.formatAmountDecimal(rawB, decimals);

    // Untuk AMM, kita lacak nilai USD karena terdiri dari 2 token berbeda
    // Ganti alamat token ini dengan yang sesuai untuk pool Anda
    const priceA = await this.getPriceUsd("0xALAMAT_TOKEN_A_DI_POOL_INI");
    const priceB = await this.getPriceUsd("0xALAMAT_TOKEN_B_DI_POOL_INI"); 
    const valueA = priceA ? a.mul(priceA) : a; // Fallback ke jumlah token jika harga tidak ada
    const valueB = priceB ? b.mul(priceB) : b;
    const totalValueUsd = valueA.plus(valueB);
    const signedValue = isAdd ? totalValueUsd : totalValueUsd.neg();
    const userId = await this.findOrCreateUserAndProfile(user);

    // 1. Perbarui profil pengguna untuk leaderboard (berdasarkan nilai USD)
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalAmmLiquidityVolume: { increment: signedValue.toString() },
        lastUpdatedBlock: BigInt(blockNumber)
      }
    });

    // 2. PERBARUI TVL GLOBAL SECARA REAL-TIME (langsung dalam USD)
    await this.prisma.platformAnalytics.upsert({
        where: { category: `AMM_LIQUIDITY` }, // Bisa lebih spesifik, misal: 'AMM_KLAY_USDT'
        update: { totalTokens: { increment: signedValue.toString() } },
        create: { category: `AMM_LIQUIDITY`, totalTokens: signedValue.toString() },
    });
    
    await this.markProcessed(txHash, logIndex, address, eventName, BigInt(blockNumber));
    this.logger.log(`✅ Berhasil memproses ${eventName} [${txHash}:${logIndex}]`);
  }

  // ===================================================================================
  // == METODE HELPER LAINNYA (TIDAK BERUBAH)
  // ===================================================================================

  private async _processSbtMint(args: readonly any[], event: EventLog) {
    const [_from, to, tokenId] = args;
    const { transactionHash: txHash, index: logIndex, blockNumber, address } = event;

    const userId = await this.findOrCreateUserAndProfile(to);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hasSbt: true,
        sbtTokenId: BigInt(tokenId.toString()),
        sbtContractAddress: address.toLowerCase(),
      },
    });

    await this.markProcessed(txHash, logIndex, address, 'SbtMinted', BigInt(blockNumber));
    this.logger.log(`✅ Berhasil memproses Mint SBT [${txHash}:${logIndex}] untuk user=${to}`);
  }
  
  private async _processHarvest(args: readonly any[], event: EventLog) {
    const [user] = args;
    const { transactionHash: txHash, index: logIndex, blockNumber, address } = event;

    const userId = await this.findOrCreateUserAndProfile(user);
    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        harvestCount: { increment: 1 },
        lastUpdatedBlock: BigInt(blockNumber)
      }
    });

    await this.markProcessed(txHash, logIndex, address, 'Harvested', BigInt(blockNumber));
    this.logger.log(`✅ Berhasil memproses Harvest [${txHash}:${logIndex}] user=${user}`);
  }

  private async _updateLendBorrow(args: readonly any[], event: EventLog, isBorrow: boolean) {
    const [user, rawAmount] = args;
    const { transactionHash: txHash, index: logIndex, blockNumber, address } = event;
    const eventName = isBorrow ? 'Borrowed' : 'Repaid';

    const decimals = await this.getTokenDecimals(address);
    const amt = this.formatAmountDecimal(rawAmount, decimals);
    const signed = isBorrow ? amt : amt.neg();
    const userId = await this.findOrCreateUserAndProfile(user);

    await this.prisma.deFiProfile.update({
      where: { userId },
      data: {
        totalLendBorrowVolume: { increment: signed.toString() },
        lastUpdatedBlock: BigInt(blockNumber)
      }
    });

    await this.markProcessed(txHash, logIndex, address, eventName, BigInt(blockNumber));
    this.logger.log(`✅ Berhasil memproses ${eventName} [${txHash}:${logIndex}]`);
  }

  private async alreadyProcessed(txHash: string, logIndex: number): Promise<boolean> {
    const rec = await this.prisma.eventProcessed.findUnique({
      where: { txHash_logIndex: { txHash, logIndex } },
    });
    return !!rec;
  }

  private async markProcessed(txHash: string, logIndex: number, contractAddr: string, eventName: string, blockNumber: bigint) {
    await this.prisma.eventProcessed.create({
      data: { txHash, logIndex, contractAddr: contractAddr.toLowerCase(), eventName, blockNumber, confirmed: true },
    }).catch(err => {
      this.logger.warn(`Gagal menandai event sebagai terproses: ${txHash}:${logIndex}`, err.message);
    });
  }

  private async hasEnoughConfirmations(blockNumber: number): Promise<boolean> {
    const latestBlock = await this.provider.getBlockNumber();
    const confirmations = latestBlock - blockNumber;
    if (confirmations < this.CONFIRMATIONS) {
        this.logger.debug(`Event di blok ${blockNumber} baru memiliki ${confirmations}/${this.CONFIRMATIONS} konfirmasi. Menunggu...`);
        return false;
    }
    return true;
  }

  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    if (!tokenAddress) return 18;
    const lowerAddr = tokenAddress.toLowerCase();
    if (this.decimalsCache.has(lowerAddr)) {
      return this.decimalsCache.get(lowerAddr)!;
    }
    try {
      const erc20 = new Contract(lowerAddr, ['function decimals() view returns (uint8)'], this.provider);
      const d: number = await erc20.decimals();
      this.decimalsCache.set(lowerAddr, d);
      return d;
    } catch (err) {
      this.logger.warn(`Gagal ambil decimals untuk ${lowerAddr}, menggunakan default 18`);
      this.decimalsCache.set(lowerAddr, 18);
      return 18;
    }
  }

  private formatAmountDecimal(raw: ethers.BigNumberish, decimals = 18): Decimal {
    const s = ethers.formatUnits(raw, decimals);
    return new Decimal(s);
  }

  private async getPriceUsd(tokenAddress: string | null): Promise<Decimal | null> {
    if (!this.cmcApiKey || !tokenAddress) return null;

    const lowerAddr = tokenAddress.toLowerCase();
    const symbol = this.tokenSymbolMap.get(lowerAddr);

    if (!symbol) {
      this.logger.debug(`Tidak ada simbol yang terdaftar untuk alamat ${lowerAddr}`);
      return null;
    }

    const cached = this.priceCache.get(symbol);
    if (cached && (Date.now() - cached.timestamp < this.PRICE_CACHE_DURATION_MS)) {
      return cached.price;
    }

    try {
      this.logger.debug(`Mengambil harga untuk ${symbol} dari CoinMarketCap...`);
      const response = await axios.get(
        'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest',
        {
          headers: { 'X-CMC_PRO_API_KEY': this.cmcApiKey },
          params: { symbol: symbol.toUpperCase() },
        },
      );

      const price = response.data.data[symbol.toUpperCase()][0].quote.USD.price;
      const priceDecimal = new Decimal(price);

      this.priceCache.set(symbol, { price: priceDecimal, timestamp: Date.now() });
      return priceDecimal;

    } catch (error) {
      const msg = (error && (error as any).message) ? (error as any).message : String(error);
      this.logger.error(`Gagal mengambil harga untuk ${symbol}: ${msg}`);
      return null;
    }
  }

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