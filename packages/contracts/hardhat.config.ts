import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// Plugin tambahan yang sangat direkomendasikan untuk proyek kompleks
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";

// Memastikan environment variables yang dibutuhkan sudah ada
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/your-infura-key";
const KAIA_MAINNET_RPC_URL = process.env.KAIA_MAINNET_RPC_URL || "https://your-kaia-mainnet-rpc-url";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "YourEtherscanApiKey";
const KAIASCAN_API_KEY = process.env.KAIASCAN_API_KEY || "YourKaiaScanApiKey";


const config: HardhatUserConfig = {
  // Versi solidity yang digunakan, sesuai dokumentasi Anda
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Standar optimisasi untuk mengurangi gas cost
      },
      // viaIR: true, // Aktifkan jika kontrak sangat kompleks untuk optimisasi lebih lanjut
    },
  },

  // Default network saat menjalankan `npx hardhat test/run/etc.`
  defaultNetwork: "hardhat",

  // Konfigurasi untuk berbagai jaringan
  networks: {
    // Jaringan lokal untuk development cepat
    hardhat: {
      chainId: 31337,
      // Forking mainnet untuk simulasi yang lebih realistis
      // forking: {
      //   url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      // }
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545/",
    },
    // Testnet publik (Sepolia)
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    // Jaringan utama Kaia (Contoh)
    kaia_mainnet: {
      url: KAIA_MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 8217, // Chain ID Klaytn/Kaia Mainnet
    },
    // Jaringan testnet Kaia (Contoh: Baobab)
    kaia_testnet: {
      url: process.env.KAIA_TESTNET_RPC_URL || "https://api.baobab.klaytn.net:8651",
      accounts: [PRIVATE_KEY],
      chainId: 1001, // Chain ID Klaytn/Kaia Testnet Baobab
    }
  },

  // Konfigurasi untuk verifikasi kontrak otomatis di Etherscan/KaiaScan
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      kaia_mainnet: KAIASCAN_API_KEY, // Menggunakan nama network dari atas
      kaia_testnet: KAIASCAN_API_KEY,
    },
    customChains: [
      {
        network: "kaia_mainnet",
        chainId: 8217,
        urls: {
          apiURL: "https://api-scope.klaytn.com/api", // URL API KaiaScan / Klaytnscope
          browserURL: "https://scope.klaytn.com", // URL block explorer
        },
      },
       {
        network: "kaia_testnet",
        chainId: 1001,
        urls: {
          apiURL: "https://api-baobab.klaytnscope.com/api",
          browserURL: "https://baobab.klaytnscope.com",
        },
      },
    ],
  },
  
  // Konfigurasi untuk plugin gas reporter (menganalisis biaya gas saat testing)
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined, // Aktifkan dengan `REPORT_GAS=true npx hardhat test`
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY, // Opsional, untuk konversi ke USD
  },

  // Konfigurasi untuk plugin hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0, // Akun pertama di array `accounts` akan menjadi 'deployer'
    },
    admin: {
      default: 1, // Akun kedua akan menjadi 'admin'
    },
  },
  
  // Menentukan path untuk berbagai komponen proyek
  paths: {
  sources: "./contracts",
  tests: "./test",
  cache: "./cache",
  artifacts: "./artifacts",
 },
};

export default config;