// hardhat.config.ts

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// Plugin tambahan
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";

// =================================================================
// 1. MENGAMBIL DAN MEMVALIDASI ENVIRONMENT VARIABLES DARI FILE .env
// =================================================================
const KAIROS_RPC_URL = process.env.KAIROS_RPC_URL || "https://public-en-kairos.node.kaia.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Validasi variabel penting
if (!PRIVATE_KEY) {
  throw new Error("⚠️ Silakan atur PRIVATE_KEY Anda di file .env");
}

// =================================================================
// 2. KONFIGURASI UTAMA HARDHAT
// =================================================================
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  defaultNetwork: "hardhat",

  networks: {
    // Jaringan lokal untuk development dan testing
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545/",
    },
    
    // Testnet publik Kaia (Kairos)
    kairos: {
      url: KAIROS_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 1001,
    },
  },

  // Konfigurasi untuk verifikasi kontrak otomatis
  etherscan: {
    apiKey: {
      // API Key tidak diperlukan untuk verifikasi di testnet Kairos
      kairos: "unnecessary", 
    },
    customChains: [
      // Konfigurasi agar Hardhat mengenali jaringan Kairos
      {
        network: "kairos",
        chainId: 1001,
        urls: {
          apiURL: "https://api-kairos.kaiascan.io/api",
          browserURL: "https://kairos.kaiascan.io",
        },
      },
    ],
  },
  
  // Konfigurasi untuk plugin gas reporter
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  // Konfigurasi untuk plugin hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0, // Akun pertama (index 0) dari 'accounts' akan menjadi 'deployer'
    },
    user: {
      default: 1, // Akun kedua (index 1) akan menjadi 'user'
    }
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;