// packages/scripts/deploy.ts

import { ethers } from "hardhat";
import { formatEther } from "ethers";

// =================== KONFIGURASI SEBELUM DEPLOYMENT ===================
// Ganti dengan Merkle Root yang Anda hasilkan secara off-chain untuk airdrop.
const MERKLE_ROOT_AIRDROP = "0x0000000000000000000000000000000000000000000000000000000000000000"; 
// Total token LINKA yang akan dialokasikan untuk airdrop.
const TOTAL_AIRDROP_AMOUNT = ethers.parseEther("1000000"); // 1 Juta LINKA

// Alamat yang akan menjadi pemilik/admin utama setelah deployment.
// Untuk produksi, ini HARUS alamat Gnosis Safe (Multi-sig) atau DAO.
const FINAL_ADMIN_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Ganti dengan alamat admin production

// =====================================================================


async function main() {
  console.log("🚀 Memulai proses deployment KaiaLink Protocol...");
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Saldo Deployer: ${formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("----------------------------------------------------");

  // --- FASE 1: DEPLOYMENT TOKEN INTI ---
  console.log(" Fase 1: Deploying Core Tokens...");

  const LinkaToken = await ethers.getContractFactory("LinkaToken");
  const linkaToken = await LinkaToken.deploy(deployer.address);
  await linkaToken.waitForDeployment();
  const linkaTokenAddress = await linkaToken.getAddress();
  console.log(`✅ LinkaToken di-deploy ke: ${linkaTokenAddress}`);

  const SBT = await ethers.getContractFactory("SBT");
  const sbt = await SBT.deploy(deployer.address);
  await sbt.waitForDeployment();
  const sbtAddress = await sbt.getAddress();
  console.log(`✅ SBT di-deploy ke: ${sbtAddress}`);
  console.log("----------------------------------------------------");

  // --- FASE 2: DEPLOYMENT MODUL AMM (DEX) ---
  console.log(" Fase 2: Deploying AMM (DEX) Module...");

  // Di jaringan nyata (mainnet/testnet), kita akan menggunakan alamat WETH yang sudah ada.
  // Untuk local development, kita deploy mock WETH.
  const WETH = await ethers.getContractFactory("WETH"); // Anda perlu membuat kontrak mock WETH9.sol
  const weth = await WETH.deploy();
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log(`✅ Mock WETH di-deploy ke: ${wethAddress}`);

  const KaiaLinkFactory = await ethers.getContractFactory("KaiaLinkFactory");
  const factory = await KaiaLinkFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`✅ KaiaLinkFactory di-deploy ke: ${factoryAddress}`);

  const KaiaLinkRouter = await ethers.getContractFactory("KaiaLinkRouter");
  const router = await KaiaLinkRouter.deploy(factoryAddress, wethAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log(`✅ KaiaLinkRouter di-deploy ke: ${routerAddress}`);
  console.log("----------------------------------------------------");
  
  // --- FASE 3: DEPLOYMENT MODUL REWARDS (AIRDROP) ---
  console.log(" Fase 3: Deploying Rewards (Airdrop) Module...");

  const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
  const merkleDistributor = await MerkleDistributor.deploy(linkaTokenAddress, MERKLE_ROOT_AIRDROP);
  await merkleDistributor.waitForDeployment();
  const merkleDistributorAddress = await merkleDistributor.getAddress();
  console.log(`✅ MerkleDistributor di-deploy ke: ${merkleDistributorAddress}`);

  // Konfigurasi Post-Deployment: Kirim total token airdrop ke kontrak distributor.
  console.log(` MINTING & MENGIRIM ${formatEther(TOTAL_AIRDROP_AMOUNT)} LINKA ke MerkleDistributor...`);
  await linkaToken.mint(merkleDistributorAddress, TOTAL_AIRDROP_AMOUNT);
  console.log(" Token airdrop berhasil dikirim.");
  console.log("----------------------------------------------------");

  // --- FASE 4: DEPLOYMENT MODUL STAKING ---
  console.log(" Fase 4: Deploying Staking Module & Setup...");

  // Untuk mendeploy StakingRewards, kita butuh LP Token.
  // LP Token baru ada setelah kita membuat pair dan menambah likuiditas.
  // Mari kita buat pair LINKA/WETH sebagai contoh.
  console.log(" Membuat pair LINKA/WETH melalui Factory...");
  await factory.createPair(linkaTokenAddress, wethAddress);
  const lpTokenAddress = await factory.getPair(linkaTokenAddress, wethAddress);
  console.log(`✅ Pair LINKA/WETH (LP Token) berhasil dibuat di: ${lpTokenAddress}`);

  const StakingRewards = await ethers.getContractFactory("StakingRewards");
  const stakingRewards = await StakingRewards.deploy(lpTokenAddress, linkaTokenAddress);
  await stakingRewards.waitForDeployment();
  const stakingRewardsAddress = await stakingRewards.getAddress();
  console.log(`✅ StakingRewards di-deploy ke: ${stakingRewardsAddress}`);

  // Konfigurasi Post-Deployment: Berikan izin 'mint' kepada kontrak StakingRewards
  console.log(" Memberikan MINTER_ROLE kepada kontrak StakingRewards...");
  const MINTER_ROLE = await linkaToken.MINTER_ROLE();
  await linkaToken.grantRole(MINTER_ROLE, stakingRewardsAddress);
  console.log(" Izin berhasil diberikan.");

  // Konfigurasi Post-Deployment: Isi kontrak Staking dengan reward awal
  const totalStakingRewards = ethers.parseEther("5000000"); // 5 Juta LINKA untuk rewards
  console.log(` Mengisi StakingRewards dengan ${formatEther(totalStakingRewards)} LINKA...`);
  await linkaToken.mint(stakingRewardsAddress, totalStakingRewards);
  await stakingRewards.notifyRewardAmount(totalStakingRewards);
  console.log(" Reward staking awal berhasil diatur.");
  console.log("----------------------------------------------------");

  // --- FASE 5: FINALISASI & PENYERAHAN KEPEMILIKAN ---
  console.log(" Fase 5: Finalizing Ownership...");
  // Di skrip production, Anda HARUS mentransfer semua kepemilikan
  // ke alamat yang aman seperti Multi-sig atau DAO.
  
  // Contoh: Menyerahkan admin role dari LinkaToken
  const DEFAULT_ADMIN_ROLE = await linkaToken.DEFAULT_ADMIN_ROLE();
  console.log(` Menyerahkan DEFAULT_ADMIN_ROLE di LinkaToken ke ${FINAL_ADMIN_ADDRESS}...`);
  await linkaToken.grantRole(DEFAULT_ADMIN_ROLE, FINAL_ADMIN_ADDRESS);
  await linkaToken.renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);
  console.log(` Kepemilikan LinkaToken diserahkan.`);
  
  // Contoh: Menyerahkan kepemilikan StakingRewards
  console.log(` Menyerahkan kepemilikan StakingRewards ke ${FINAL_ADMIN_ADDRESS}...`);
  await stakingRewards.transferOwnership(FINAL_ADMIN_ADDRESS);
  console.log(` Kepemilikan StakingRewards diserahkan.`);
  console.log("----------------------------------------------------");


  console.log("🎉 SELURUH KONTRAK BERHASIL DI-DEPLOY DAN DIKONFIGURASI! 🎉");
  console.log("\n====== RINGKASAN ALAMAT KONTRAK ======");
  console.log(`LinkaToken (LINKA): ${linkaTokenAddress}`);
  console.log(`Soulbound Token (SBT): ${sbtAddress}`);
  console.log(`WETH (Mock): ${wethAddress}`);
  console.log(`KaiaLinkFactory: ${factoryAddress}`);
  console.log(`KaiaLinkRouter: ${routerAddress}`);
  console.log(`Pair LINKA/WETH (LP): ${lpTokenAddress}`);
  console.log(`StakingRewards (for LINKA/WETH): ${stakingRewardsAddress}`);
  console.log(`MerkleDistributor (Airdrop): ${merkleDistributorAddress}`);
  console.log("========================================");

}

main().catch((error) => {
  console.error("❌ Terjadi error saat deployment:", error);
  process.exitCode = 1;
});