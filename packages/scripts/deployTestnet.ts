/// <reference types="hardhat" />
import hre, { ethers } from "hardhat";

// SCRIPT FINAL - SEMUA PERBAIKAN DAN FASE 8 SUDAH TERMASUK

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ===================== CONFIG (env-friendly) =====================
const CONFIG: any = {
  FINAL_ADMIN_ADDRESS: process.env.FINAL_ADMIN_ADDRESS || "0xE53DEfcFEe69d145bC5335414887701141D510f9",

  ECOSYSTEM_WALLET: process.env.ECOSYSTEM_WALLET || "0x1e27E73C58f828B0b55B89B83b8733F2A7097aa4",
  MARKETING_WALLET: process.env.MARKETING_WALLET || "0xFAE7ba2505267B36438a20e74f816903Cc069079",
  OPERATIONS_WALLET: process.env.OPERATIONS_WALLET || "0x9DaA08E574cfB4632Ab059b68a30e0412a1528ce",
  AIRDROP_TGE_WALLET: process.env.AIRDROP_TGE_WALLET || "0x220347138308fb0556724B43cA03D960D55701F7",
  TEAM_BENEFICIARY: process.env.TEAM_BENEFICIARY || "0x3Aa1b118b2032c097d56093c6622C911fA78F56B",
  INVESTOR_BENEFICIARY: process.env.INVESTOR_BENEFICIARY || "0xE4d11dDE9B69C8E3932C29Fa086b8B117Ba12fDb",
  AIRDROP_BENEFICIARY: process.env.AIRDROP_BENEFICIARY || "0xbFd09498b989D807C80E979c77225EEb9d6f21Be",

  TOTAL_SUPPLY: ethers.parseEther(process.env.TOTAL_SUPPLY || "1000000000"),

  MERKLE_ROOT_AIRDROP:
    process.env.MERKLE_ROOT_AIRDROP ||
    "0x0000000000000000000000000000000000000000000000000000000000000000",
};

// ---------------------- validate addresses ----------------------
function assertAddress(name: string, value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(`[CONFIG-ERR] ${name} harus berupa string (diberikan: ${String(value)})`);
  }
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    throw new Error(`[CONFIG-ERR] ${name} bukan address valid: "${value}"`);
  }
  return trimmed;
}

const ADDRESS_KEYS = [
  "FINAL_ADMIN_ADDRESS",
  "ECOSYSTEM_WALLET",
  "MARKETING_WALLET",
  "OPERATIONS_WALLET",
  "AIRDROP_TGE_WALLET",
  "TEAM_BENEFICIARY",
  "INVESTOR_BENEFICIARY",
  "AIRDROP_BENEFICIARY",
] as const;

for (const k of ADDRESS_KEYS) {
  // @ts-ignore
  if (CONFIG[k] === undefined || CONFIG[k] === null) {
    throw new Error(`[CONFIG-ERR] Missing required address config: ${k}`);
  }
  // @ts-ignore assign back trimmed & validated
  CONFIG[k] = assertAddress(k, CONFIG[k]);
}

console.log("🔁 Running deploy script in TARGET_NETWORK=" + (process.env.TARGET_NETWORK || process.env.HARDHAT_NETWORK || "local"));
console.log("✅ CONFIG addresses validated:");
for (const k of ADDRESS_KEYS) {
  // @ts-ignore
  console.log(`  - ${k}: ${CONFIG[k]}`);
}
console.log("----------------------------------------------------");

// ---------------------- CLI / env flags -------------------------
const SKIP_LIQUIDITY = process.env.SKIP_LIQUIDITY === "true";
const SKIP_SWAP = process.env.SKIP_SWAP === "true";

// ========================= Utilities & Helpers =========================

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const retries = opts.retries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 1500;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const message = String(err?.code || err?.message || "").toLowerCase();
      const isConnTimeout =
        message.includes("timeout") ||
        message.includes("connecttimeout") ||
        message.includes("und_err_connect_timeout") ||
        message.includes("socket hang up") ||
        message.includes("request failed");
      if (!isConnTimeout || attempt > retries) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`withRetry: transient error (attempt ${attempt}/${retries}). retrying in ${delay}ms...`, err?.message ?? err);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

function padRight(str: string, len: number) {
  return str + " ".repeat(Math.max(0, len - str.length));
}

function formatAddress(a: string | null | undefined) {
  if (!a) return "-";
  return a;
}

function printTable(rows: Array<[string, string, string]>) {
  const headers = ["CONTRACT", "ADDRESS", "NOTES"];
  const all = [headers, ...rows];
  const colWidths = [0, 0, 0];
  for (const r of all) {
    colWidths[0] = Math.max(colWidths[0], r[0].length);
    colWidths[1] = Math.max(colWidths[1], r[1].length);
    colWidths[2] = Math.max(colWidths[2], r[2].length);
  }

  const sep = `+-${"-".repeat(colWidths[0])}-+-${"-".repeat(colWidths[1])}-+-${"-".repeat(colWidths[2])}-+`;
  console.log(sep);
  console.log(`| ${padRight(headers[0], colWidths[0])} | ${padRight(headers[1], colWidths[1])} | ${padRight(headers[2], colWidths[2])} |`);
  console.log(sep);
  for (const r of rows) {
    console.log(`| ${padRight(r[0], colWidths[0])} | ${padRight(r[1], colWidths[1])} | ${padRight(r[2], colWidths[2])} |`);
  }
  console.log(sep);
}

async function buildSummaryRows(context: any) {
  const {
    linkaToken, sbt, pointsMinter, weth, comptroller, interestRateModel,
    cLinka, cUsdt, cKaia, cWeth, factory, router, lpTokenAddress,
    lpLinkaUsdtAddr, lpLinkaKaiaAddr, stakingRewards, stakingUsdtLinka,
    stakingKaiaLinka, merkleDistributor, teamVestingWallet,
    investorVestingWallet, airdropVestingWallet,
  } = context;

  const rows: Array<[string, string, string]> = [];
  rows.push(["LinkaToken (LINKA)", formatAddress(linkaToken ? await linkaToken.getAddress() : null), "Governance & utility token"]);
  rows.push(["SBT", formatAddress(sbt ? await sbt.getAddress() : null), "Soulbound token contract"]);
  rows.push(["PointsMinter", formatAddress(pointsMinter ? await pointsMinter.getAddress() : null), "Minter for SBT"]);
  rows.push(["WETH (Mock)", formatAddress(weth ? await weth.getAddress() : null), "Wrapped ETH (mock for tests)"]);
  rows.push(["Comptroller", formatAddress(comptroller ? await comptroller.getAddress() : null), "Lending market manager"]);
  rows.push(["InterestRateModel", formatAddress(interestRateModel ? await interestRateModel.getAddress() : null), "Interest calculations for lending"]);
  rows.push(["CToken (cLINKA)", formatAddress(cLinka ? await cLinka.getAddress() : null), "cToken for LINKA (lend/borrow)"]);
  rows.push(["CToken (cUSDT)", formatAddress(cUsdt ? await cUsdt.getAddress() : null), "cToken for USDT (lend/borrow)"]);
  rows.push(["CToken (cKAIA)", formatAddress(cKaia ? await cKaia.getAddress() : null), "cToken for KAIA (lend/borrow)"]);
  rows.push(["CToken (cWETH)", formatAddress(cWeth ? await cWeth.getAddress() : null), "cToken for WETH (lend/borrow)"]);
  rows.push(["KaiaLinkFactory", formatAddress(factory ? await factory.getAddress() : null), "AMM factory (pairs)"]);
  rows.push(["KaiaLinkRouter", formatAddress(router ? await router.getAddress() : null), "AMM router (swaps & liquidity)"]);
  rows.push(["Pair LINKA/WETH (LP)", formatAddress(lpTokenAddress || null), "Main staking LP"]);
  rows.push(["Pair LINKA/USDT (LP)", formatAddress(lpLinkaUsdtAddr || null), "Liquidity pair for LINKA-USDT"]);
  rows.push(["Pair LINKA/KAIA (LP)", formatAddress(lpLinkaKaiaAddr || null), "Liquidity pair for LINKA-KAIA"]);
  rows.push(["StakingRewards (LINKA/WETH)", formatAddress(stakingRewards ? await stakingRewards.getAddress() : null), "Primary staking rewards contract"]);
  rows.push(["StakingRewards (USDT/LINKA)", formatAddress(stakingUsdtLinka ? await stakingUsdtLinka.getAddress() : null), "Additional LP staking"]);
  rows.push(["StakingRewards (KAIA/LINKA)", formatAddress(stakingKaiaLinka ? await stakingKaiaLinka.getAddress() : null), "Additional LP staking"]);
  rows.push(["MerkleDistributor (Airdrop TGE)", formatAddress(merkleDistributor ? await merkleDistributor.getAddress() : null), "Airdrop distribution contract"]);
  rows.push(["Team VestingWallet", formatAddress(teamVestingWallet ? await teamVestingWallet.getAddress() : null), "Team tokens (vested)"]);
  rows.push(["Investor VestingWallet", formatAddress(investorVestingWallet ? await investorVestingWallet.getAddress() : null), "Investor tokens (vested)"]);
  rows.push(["Airdrop VestingWallet", formatAddress(airdropVestingWallet ? await airdropVestingWallet.getAddress() : null), "Airdrop vesting (partial liquid)"]);

  return rows;
}

function tryDecodeRevert(data: any) {
  try {
    if (!data) return null;
    if (typeof data === "object" && data.data) data = data.data;
    if (typeof data !== "string") data = String(data);
    if (!data.startsWith("0x")) return null;
    const hex = data.replace(/^0x/, "");
    const possiblePayload = "0x" + hex.slice(8 + 64);
    try {
      return ethers.toUtf8String(possiblePayload);
    } catch (_) {
      try { return ethers.toUtf8String(data); } catch (_) { return null; }
    }
  } catch (e) { return null; }
}

async function createPairSafe(factory: any, tokenAAddr: string, tokenBAddr: string) {
  console.log(` -> createPairSafe: requesting pair for ${tokenAAddr} / ${tokenBAddr}`);
  if (!tokenAAddr || tokenAAddr === ZERO_ADDRESS) throw new Error("createPairSafe: tokenA is zero address");
  if (!tokenBAddr || tokenBAddr === ZERO_ADDRESS) throw new Error("createPairSafe: tokenB is zero address");
  if (tokenAAddr.toLowerCase() === tokenBAddr.toLowerCase()) throw new Error("createPairSafe: tokenA == tokenB");

  let tx;
  try {
    tx = await withRetry(async () => await factory.createPair(tokenAAddr, tokenBAddr), { retries: 4, baseDelayMs: 1000 });
  } catch (e: any) {
    try { await factory.callStatic.createPair(tokenAAddr, tokenBAddr); } catch (ee: any) { throw new Error(`createPair failed: ${ee?.message ?? ee}`); }
    throw new Error(`createPair failed (unknown reason): ${e?.message ?? e}`);
  }

  console.log(`   -> createPair tx sent: ${tx.hash}`);
  const receipt = await withRetry(async () => await tx.wait(), { retries: 4, baseDelayMs: 1000 });
  console.log(`   -> createPair tx mined (status: ${receipt.status}) logs: ${receipt.logs?.length ?? 0}`);

  try {
    for (const log of receipt.logs || []) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed && parsed.name === "PairCreated") {
          const pairAddr = parsed.args?.pair ?? parsed.args?.[2] ?? null;
          if (pairAddr && pairAddr !== ZERO_ADDRESS) {
            console.log(`   -> PairCreated event decoded, pair: ${pairAddr}`);
            return pairAddr;
          }
        }
      } catch (_) { }
    }
  } catch (e: any) { console.log("   -> failed parsing logs:", e?.message ?? e); }

  let pairAddr = await factory.getPair(tokenAAddr, tokenBAddr);
  if (!pairAddr || pairAddr === ZERO_ADDRESS) {
    pairAddr = await factory.getPair(tokenBAddr, tokenAAddr);
    if (pairAddr && pairAddr !== ZERO_ADDRESS) { console.log("   -> getPair returned non-zero for reversed order"); }
  }

  if (!pairAddr || pairAddr === ZERO_ADDRESS) {
    console.error("   -> createPairSafe: PAIR STILL ZERO after tx. Receipt summary:", { txHash: tx.hash, status: receipt.status, logs: (receipt.logs || []).length });
    throw new Error(`createPairSafe: pair creation failed for ${tokenAAddr} / ${tokenBAddr} — pair address is zero. Inspect tx ${tx.hash}`);
  }
  return pairAddr;
}

async function tryNotifyReward(linkaToken: any, stakingContract: any, deployer: any, amount: bigint) {
  const stakingAddr = await stakingContract.getAddress();
  const deployerAddr = await deployer.getAddress();
  try {
    console.log(` -> Funding StakingRewards contract (${stakingAddr}) with ${ethers.formatEther(amount)} LINKA...`);
    await linkaToken.mint(deployerAddr, amount);
    console.log(`  - Minted ${ethers.formatEther(amount)} LINKA to deployer.`);
    await (await linkaToken.connect(deployer).approve(stakingAddr, amount)).wait();
    console.log(`  - Deployer approved StakingRewards contract.`);
    await (await stakingContract.connect(deployer).notifyRewardAmount(amount)).wait();
    console.log(`  - StakingRewards notified with ${ethers.formatEther(amount)} LINKA successfully.`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ Failed to fund and notify StakingRewards:`, err?.message ?? err);
    console.log("   -> Skipping notifyRewardAmount due to previous errors.");
    return false;
  }
}

// ========================= MAIN =========================
async function main() {
  console.log("🚀 Memulai proses deployment KaiaLink pada mode TESTNET-adapted...");
  const [deployer] = await ethers.getSigners();
  const signers = await ethers.getSigners();
  console.log(`Akun Deployer: ${await deployer.getAddress()}`);
  console.log(`Saldo Deployer: ${ethers.formatEther(await ethers.provider.getBalance(await deployer.getAddress()))} ETH`);
  console.log("----------------------------------------------------");

  let linkaToken: any, sbt: any, pointsMinter: any, weth: any, interestRateModel: any, comptroller: any, cLinka: any, factory: any, router: any, stakingRewards: any, teamVestingWallet: any, investorVestingWallet: any, airdropVestingWallet: any, merkleDistributor: any;
  let usdt: any, kaia: any;
  let cUsdt: any, cKaia: any, cWeth: any;
  let stakingUsdtLinka: any, stakingKaiaLinka: any;
  let lpLinkaUsdtAddr: string, lpLinkaKaiaAddr: string;
  let lpTokenAddress: string;

  console.log(" Fase 1: Deploying Core Contracts (Tokens, etc)...");
  const LinkaTokenFactory = await ethers.getContractFactory("LinkaTestnet");
  linkaToken = await LinkaTokenFactory.deploy(await deployer.getAddress(), CONFIG.TOTAL_SUPPLY);
  await linkaToken.waitForDeployment();
  console.log(`✅ Linka Token (LINKA) di-deploy ke: ${await linkaToken.getAddress()}`);
  const SBT_Factory = await ethers.getContractFactory("SBT");
  sbt = await SBT_Factory.deploy(await deployer.getAddress());
  await sbt.waitForDeployment();
  console.log(`✅ Soulbound Token (SBT) di-deploy ke: ${await sbt.getAddress()}`);
  const PointsMinter_Factory = await ethers.getContractFactory("PointsMinter");
  pointsMinter = await PointsMinter_Factory.deploy(await sbt.getAddress(), await deployer.getAddress());
  await pointsMinter.waitForDeployment();
  console.log(`✅ PointsMinter di-deploy ke: ${await pointsMinter.getAddress()}`);
  if (process.env.WETH_ADDRESS && process.env.WETH_ADDRESS !== "") {
    weth = await ethers.getContractAt("WETH", process.env.WETH_ADDRESS);
    console.log(` -> Using WETH from ENV: ${process.env.WETH_ADDRESS}`);
  } else {
    const WETH_Factory = await ethers.getContractFactory("WETH");
    weth = await WETH_Factory.deploy();
    await weth.waitForDeployment();
    console.log(` -> No WETH address provided, deploying Mock WETH at ${await weth.getAddress()}`);
  }
  console.log("----------------------------------------------------");

  console.log(" Fase 2: Deploying Lending Module...");
  const InterestRateModel_Factory = await ethers.getContractFactory("FixedRateModel");
  interestRateModel = await InterestRateModel_Factory.deploy();
  await interestRateModel.waitForDeployment();
  console.log(`✅ InterestRateModel di-deploy ke: ${await interestRateModel.getAddress()}`);
  const Comptroller_Factory = await ethers.getContractFactory("Comptroller");
  comptroller = await Comptroller_Factory.deploy(await deployer.getAddress());
  await comptroller.waitForDeployment();
  console.log(`✅ Comptroller di-deploy ke: ${await comptroller.getAddress()}`);
  const CToken_Factory = await ethers.getContractFactory("CToken");
  cLinka = await CToken_Factory.deploy(await linkaToken.getAddress(), await comptroller.getAddress(), await interestRateModel.getAddress(), ethers.parseEther("1"), ethers.parseEther("0.8"), "KaiaLink LINKA", "cLINKA", await deployer.getAddress());
  await cLinka.waitForDeployment();
  console.log(`✅ CToken (cLINKA) di-deploy ke: ${await cLinka.getAddress()}`);
  await comptroller._supportMarket(await cLinka.getAddress());
  console.log(" -> Market cLINKA didaftarkan ke Comptroller.");
  console.log("----------------------------------------------------");

  console.log(" Fase 3: Deploying AMM & Staking Modules...");
  const KaiaLinkFactory_Factory = await ethers.getContractFactory("KaiaLinkFactory");
  factory = await KaiaLinkFactory_Factory.deploy(await deployer.getAddress());
  await factory.waitForDeployment();
  console.log(`✅ KaiaLinkFactory di-deploy ke: ${await factory.getAddress()}`);
  const KaiaLinkRouter_Factory = await ethers.getContractFactory("KaiaLinkRouter");
  router = await KaiaLinkRouter_Factory.deploy(await factory.getAddress(), await weth.getAddress());
  await router.waitForDeployment();
  console.log(`✅ KaiaLinkRouter di-deploy ke: ${await router.getAddress()}`);
  console.log(" -> Membuat pair LINKA/WETH untuk Staking...");
  try {
    lpTokenAddress = await createPairSafe(factory, await linkaToken.getAddress(), await weth.getAddress());
    console.log(` -> Pair LINKA/WETH (LP Token) dibuat di: ${lpTokenAddress}`);
  } catch (e: any) {
    console.error("❌ createPair failed:", e?.message ?? e);
    if (!SKIP_LIQUIDITY) throw e;
  }
  if (lpTokenAddress && lpTokenAddress !== ZERO_ADDRESS) {
    const StakingRewards_Factory = await ethers.getContractFactory("StakingRewards");
    stakingRewards = await StakingRewards_Factory.deploy(lpTokenAddress, await linkaToken.getAddress());
    await stakingRewards.waitForDeployment();
    console.log(`✅ StakingRewards (LINKA/WETH) di-deploy ke: ${await stakingRewards.getAddress()}`);
  } else {
    console.log(" -> Skipping StakingRewards deployment because LP token is missing.");
  }
  console.log("----------------------------------------------------");

  console.log(" Fase 4: Deploying Vesting & Airdrop Modules...");
  const latestBlock = await ethers.provider.getBlock("latest");
  if (!latestBlock) throw new Error("Could not get latest block");
  const now = latestBlock.timestamp;
  const SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
  teamVestingWallet = await ethers.deployContract("VestingWallet", [CONFIG.TEAM_BENEFICIARY, now + 12 * SECONDS_IN_MONTH, 36 * SECONDS_IN_MONTH]);
  await teamVestingWallet.waitForDeployment();
  console.log(`✅ Team VestingWallet di-deploy ke: ${await teamVestingWallet.getAddress()}`);
  investorVestingWallet = await ethers.deployContract("VestingWallet", [CONFIG.INVESTOR_BENEFICIARY, now + 6 * SECONDS_IN_MONTH, 24 * SECONDS_IN_MONTH]);
  await investorVestingWallet.waitForDeployment();
  console.log(`✅ Investor VestingWallet di-deploy ke: ${await investorVestingWallet.getAddress()}`);
  airdropVestingWallet = await ethers.deployContract("VestingWallet", [CONFIG.AIRDROP_BENEFICIARY, now, 6 * SECONDS_IN_MONTH]);
  await airdropVestingWallet.waitForDeployment();
  console.log(`✅ Airdrop VestingWallet (50%) di-deploy ke: ${await airdropVestingWallet.getAddress()}`);
  const MerkleDistributor_Factory = await ethers.getContractFactory("MerkleDistributor");
  merkleDistributor = await MerkleDistributor_Factory.deploy(await linkaToken.getAddress(), CONFIG.MERKLE_ROOT_AIRDROP);
  await merkleDistributor.waitForDeployment();
  console.log(`✅ MerkleDistributor di-deploy ke: ${await merkleDistributor.getAddress()}`);
  console.log("----------------------------------------------------");

  console.log(" Fase 5: Distributing Tokens & AMM Testing...");
  const TOTAL = CONFIG.TOTAL_SUPPLY as bigint;
  const stakingRewardAmount = ethers.parseEther("10000000"); // 10M for LINKA/WETH
  const stakingUsdtRewardAmount = ethers.parseEther("5000000"); // 5M for LINKA/USDT
  const stakingKaiaRewardAmount = ethers.parseEther("5000000"); // 5M for LINKA/KAIA
  const totalStakingRewards = stakingRewardAmount + stakingUsdtRewardAmount + stakingKaiaRewardAmount;
  const distributionAmount = TOTAL - totalStakingRewards;

  const alloc_ecosystem = (distributionAmount * 40n) / 100n;
  const alloc_investor = (distributionAmount * 20n) / 100n;
  const alloc_team = (distributionAmount * 15n) / 100n;
  const alloc_merkle = (distributionAmount * 5n) / 100n;
  const alloc_airdrop_vesting = (distributionAmount * 5n) / 100n;
  const alloc_marketing = (distributionAmount * 10n) / 100n;
  const alloc_operations = (distributionAmount * 5n) / 100n;
  async function distributeToken(to: string, amount: bigint, label = "") {
    console.log(` ${label}Distributing ${ethers.formatEther(amount)} LINKA to ${to}`);
    await linkaToken.mint(to, amount);
  }
  await distributeToken(CONFIG.ECOSYSTEM_WALLET, alloc_ecosystem, "Ecosystem:");
  await distributeToken(await investorVestingWallet.getAddress(), alloc_investor, "InvestorVesting:");
  await distributeToken(await teamVestingWallet.getAddress(), alloc_team, "TeamVesting:");
  await distributeToken(await merkleDistributor.getAddress(), alloc_merkle, "MerkleDistributor:");
  await distributeToken(await airdropVestingWallet.getAddress(), alloc_airdrop_vesting, "AirdropVesting:");
  await distributeToken(CONFIG.MARKETING_WALLET, alloc_marketing, "Marketing:");
  await distributeToken(CONFIG.OPERATIONS_WALLET, alloc_operations, "Operations:");
  console.log(" -> Tokenomics distribution minting complete.");
  if (stakingRewards) { await tryNotifyReward(linkaToken, stakingRewards, deployer, stakingRewardAmount); }
  try {
    const MINTER_ROLE_SBT = await sbt.MINTER_ROLE();
    await sbt.grantRole(MINTER_ROLE_SBT, await pointsMinter.getAddress());
    console.log(" -> PointsMinter granted MINTER_ROLE on SBT contract.");
  } catch (e: any) { console.log(" -> Could not grant MINTER_ROLE on SBT:", e?.message ?? e); }
  console.log("----------------------------------------------------");

  console.log(" -> Fase 5.1: AMM Testing (Pairs, Liquidity & Swaps)...");
  async function deployMockToken(name: string, symbol: string, decimals: number) {
    const MockERC20 = await ethers.getContractFactory("MockERC20Decimals");
    const token = await MockERC20.deploy(name, symbol, decimals);
    await token.waitForDeployment();
    const mintAmount = ethers.parseUnits("100000000", decimals);
    await token.mint(await deployer.getAddress(), mintAmount);
    console.log(`   - Deployed Mock ${symbol} (Decimals: ${decimals}) at ${await token.getAddress()}`);
    return token;
  }
  usdt = process.env.USDT_ADDRESS ? await ethers.getContractAt("MockERC20Decimals", process.env.USDT_ADDRESS) : await deployMockToken("Mock USDT", "USDT", 6);
  kaia = process.env.KAIA_ADDRESS ? await ethers.getContractAt("MockERC20Decimals", process.env.KAIA_ADDRESS) : await deployMockToken("Mock KAIA", "KAIA", 18);

  if (!SKIP_LIQUIDITY) {
    lpLinkaUsdtAddr = await createPairSafe(factory, await linkaToken.getAddress(), await usdt.getAddress());
    console.log(`   - Pair LINKA/USDT LP: ${lpLinkaUsdtAddr}`);
    lpLinkaKaiaAddr = await createPairSafe(factory, await linkaToken.getAddress(), await kaia.getAddress());
    console.log(`   - Pair LINKA/KAIA LP: ${lpLinkaKaiaAddr}`);
    await createPairSafe(factory, await usdt.getAddress(), await kaia.getAddress());

    let ecosystemSigner: any = signers.find((s: any) => s.address.toLowerCase() === CONFIG.ECOSYSTEM_WALLET.toLowerCase());
    if (!ecosystemSigner) {
      const ECOSYSTEM_PRIVATE_KEY = process.env.ECOSYSTEM_PRIVATE_KEY;
      if (ECOSYSTEM_PRIVATE_KEY?.startsWith("0x")) {
        ecosystemSigner = new ethers.Wallet(ECOSYSTEM_PRIVATE_KEY, ethers.provider);
        console.log(` -> Using ECOSYSTEM_PRIVATE_KEY for ${await ecosystemSigner.getAddress()}`);
      } else { throw new Error("Ecosystem signer not found! Provide ECOSYSTEM_PRIVATE_KEY in env."); }
    }

    const amountForDeployer = ethers.parseEther("600000");
    console.log(` -> Transferring ${ethers.formatEther(amountForDeployer)} LINKA from Ecosystem to Deployer.`);
    await linkaToken.connect(ecosystemSigner).transfer(await deployer.getAddress(), amountForDeployer);
    await weth.connect(deployer).deposit({ value: ethers.parseEther("100") });
    console.log(" -> Deposited 100 ETH to WETH for Deployer.");

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    async function addLiq(tokenA: any, tokenB: any, amountA: bigint, amountB: bigint) {
      const [symA, symB, decA, decB] = await Promise.all([tokenA.symbol(), tokenB.symbol(), tokenA.decimals(), tokenB.decimals()]);
      console.log(`   -> Attempting addLiquidity ${symA}/${symB}: ${ethers.formatUnits(amountA, decA)} / ${ethers.formatUnits(amountB, decB)}`);
      await (await tokenA.connect(deployer).approve(await router.getAddress(), amountA)).wait();
      await (await tokenB.connect(deployer).approve(await router.getAddress(), amountB)).wait();
      await (await router.addLiquidity(await tokenA.getAddress(), await tokenB.getAddress(), amountA, amountB, 0, 0, await deployer.getAddress(), deadline)).wait();
      console.log(`   - Added liquidity for ${symA}/${symB}`);
    }
    console.log(" -> Adding liquidity to pairs...");
    await addLiq(linkaToken, usdt, ethers.parseEther("100000"), ethers.parseUnits("100000", 6));
    await addLiq(linkaToken, kaia, ethers.parseEther("100000"), ethers.parseEther("100000"));
    if (lpTokenAddress && lpTokenAddress !== ZERO_ADDRESS) await addLiq(linkaToken, weth, ethers.parseEther("50000"), ethers.parseEther("50"));
    await addLiq(usdt, kaia, ethers.parseUnits("50000", 6), ethers.parseEther("50000"));

    if (!SKIP_SWAP) {
      async function trySwap(tokenIn: any, tokenOut: any, amountIn: bigint) {
        const [symIn, symOut, decIn] = await Promise.all([tokenIn.symbol(), tokenOut.symbol(), tokenIn.decimals()]);
        console.log(`   -> Attempting swap ${ethers.formatUnits(amountIn, decIn)} ${symIn} -> ${symOut}`);
        await (await tokenIn.connect(deployer).approve(await router.getAddress(), amountIn)).wait();
        const path = [await tokenIn.getAddress(), await tokenOut.getAddress()];
        await (await router.swapExactTokensForTokens(amountIn, 0, path, await deployer.getAddress(), deadline)).wait();
        console.log(`   ✅ Swap ${symIn} -> ${symOut} successful.`);
      }
      console.log(" -> Performing swap tests...");
      await trySwap(linkaToken, usdt, ethers.parseEther("100"));
      await trySwap(linkaToken, kaia, ethers.parseEther("100"));
      if (lpTokenAddress && lpTokenAddress !== ZERO_ADDRESS) await trySwap(weth, linkaToken, ethers.parseEther("1"));
      await trySwap(usdt, linkaToken, ethers.parseUnits("100", 6));
      console.log(" -> Performing multi-hop swap test (USDT -> LINKA -> KAIA)...");
      const multiHopAmountIn = ethers.parseUnits("10", 6);
      const multiHopPath = [await usdt.getAddress(), await linkaToken.getAddress(), await kaia.getAddress()];
      await (await usdt.connect(deployer).approve(await router.getAddress(), multiHopAmountIn)).wait();
      await (await router.swapExactTokensForTokens(multiHopAmountIn, 0, multiHopPath, await deployer.getAddress(), deadline)).wait();
      console.log("   ✅ Multi-hop swap USDT -> LINKA -> KAIA successful.");
    }
  }
  console.log("----------------------------------------------------");

  console.log(" Fase 6: Finalizing Ownership...");
  await comptroller.setAdmin(CONFIG.FINAL_ADMIN_ADDRESS);
  console.log(` -> Comptroller ownership transferred to ${CONFIG.FINAL_ADMIN_ADDRESS}.`);
  console.log("----------------------------------------------------");

  console.log(" Fase 7: Testing Lending Module...");
  async function createCMarket(token: any, name: string, symbol: string) {
    const cToken = await CToken_Factory.deploy(await token.getAddress(), await comptroller.getAddress(), await interestRateModel.getAddress(), ethers.parseEther("1"), ethers.parseEther("0.8"), name, symbol, await deployer.getAddress());
    await cToken.waitForDeployment();
    await comptroller._supportMarket(await cToken.getAddress());
    console.log(`   - Market ${symbol} created at ${await cToken.getAddress()} and supported.`);
    return cToken;
  }
  if (usdt && kaia && weth) {
    try {
      cUsdt = await createCMarket(usdt, "KaiaLink USDT", "cUSDT");
      cKaia = await createCMarket(kaia, "KaiaLink KAIA", "cKAIA");
      cWeth = await createCMarket(weth, "KaiaLink WETH", "cWETH");
      const usdtSupplyAmount = ethers.parseUnits("2000", 6);
      console.log(`   [LENDING] Supplying ${ethers.formatUnits(usdtSupplyAmount, 6)} USDT...`);
      await (await usdt.connect(deployer).approve(await cUsdt.getAddress(), usdtSupplyAmount)).wait();
      await (await cUsdt.connect(deployer).mint(usdtSupplyAmount)).wait();
      console.log(`   0. Supplied ${ethers.formatUnits(usdtSupplyAmount, 6)} USDT.`);
      const supplyAmount = ethers.parseEther("10000");
      console.log(`   [LENDING] Supplying ${ethers.formatEther(supplyAmount)} LINKA as collateral...`);
      await (await linkaToken.connect(deployer).approve(await cLinka.getAddress(), supplyAmount)).wait();
      await (await cLinka.connect(deployer).mint(supplyAmount)).wait();
      console.log(`   1. Supplied ${ethers.formatEther(supplyAmount)} LINKA.`);
      await (await comptroller.connect(deployer).enterMarkets([await cLinka.getAddress(), await cUsdt.getAddress()])).wait();
      console.log("   2. Entered markets.");
      const borrowAmount = ethers.parseUnits("100", 6);
      await (await cUsdt.connect(deployer).borrow(borrowAmount)).wait();
      console.log(`   3. Borrowed ${ethers.formatUnits(borrowAmount, 6)} USDT.`);
      await (await usdt.connect(deployer).approve(await cUsdt.getAddress(), ethers.MaxUint256)).wait();
      await (await cUsdt.connect(deployer).repayBorrow(borrowAmount)).wait();
      console.log(`   4. Repaid ${ethers.formatUnits(borrowAmount, 6)} USDT.`);
      
      // ==========================================================
      // BLOK KODE DENGAN FALLBACK UNTUK REDEEM
      // ==========================================================
      console.log("   5. Attempting to redeem collateral...");
      if (cLinka.redeemUnderlying) {
          await (await cLinka.connect(deployer).redeemUnderlying(supplyAmount)).wait();
          console.log("   ✅ Redeemed underlying LINKA successfully.");
      } else {
          console.log("   -> Fungsi 'redeemUnderlying' tidak ditemukan, menggunakan 'redeem' sebagai gantinya.");
          const cTokenBalance = await cLinka.balanceOf(deployer.address);
          await (await cLinka.connect(deployer).redeem(cTokenBalance)).wait();
          console.log("   ✅ Redeemed cLINKA tokens successfully.");
      }
      console.log("   ✅ Lending cycle successful.");

    } catch (err: any) {
      console.error("   ❌ Lending tests failed:", err?.message ?? err);
      throw err;
    }
  }
  console.log("----------------------------------------------------");

  console.log(" Fase 8: Deploying & Funding Additional Staking Modules...");
  if (lpLinkaUsdtAddr && lpLinkaKaiaAddr) {
    const StakingRewards_Factory = await ethers.getContractFactory("StakingRewards");
    stakingUsdtLinka = await StakingRewards_Factory.deploy(lpLinkaUsdtAddr, await linkaToken.getAddress());
    await stakingUsdtLinka.waitForDeployment();
    console.log(`✅ StakingRewards (USDT/LINKA) di-deploy ke: ${await stakingUsdtLinka.getAddress()}`);
    stakingKaiaLinka = await StakingRewards_Factory.deploy(lpLinkaKaiaAddr, await linkaToken.getAddress());
    await stakingKaiaLinka.waitForDeployment();
    console.log(`✅ StakingRewards (KAIA/LINKA) di-deploy ke: ${await stakingKaiaLinka.getAddress()}`);
    console.log(" -> Funding new staking pools...");
    await tryNotifyReward(linkaToken, stakingUsdtLinka, deployer, stakingUsdtRewardAmount);
    await tryNotifyReward(linkaToken, stakingKaiaLinka, deployer, stakingKaiaRewardAmount);
  } else {
    console.log(" -> Skipping additional staking pools because required LP addresses are missing.");
  }
  console.log("----------------------------------------------------");

  console.log("\n Fase Akhir: Menampilkan ringkasan kontrak...");
  const context = {
    linkaToken, sbt, pointsMinter, weth, comptroller, interestRateModel, cLinka,
    cUsdt, cKaia, cWeth, factory, router, lpTokenAddress, lpLinkaUsdtAddr,
    lpLinkaKaiaAddr, stakingRewards, stakingUsdtLinka, stakingKaiaLinka,
    merkleDistributor, teamVestingWallet, investorVestingWallet, airdropVestingWallet,
  };
  const rows = await buildSummaryRows(context);
  console.log("\n====== RINGKASAN ALAMAT KONTRAK ======");
  printTable(rows);
  console.log("========================================");
  console.log("\n✅ Deployment script finished successfully!");
}

main().catch((error: any) => {
  console.error("❌ Terjadi error saat deployment:", error?.message ?? error);
  process.exitCode = 1;
});