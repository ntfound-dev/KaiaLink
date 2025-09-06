// apps/frontend/lib/web3.ts
import { http, createConfig } from 'wagmi';
import { klaytn } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// --- Definisi Chain Mainnet (Cypress) ---
const kaiaMainnet = {
  ...klaytn,
  id: 8217,
  name: 'Kaia Mainnet',
  nativeCurrency: { name: 'Kaia', symbol: 'KAIA', decimals: 18 },
  rpcUrls: { default: { http: ['https://public-node-api.klaytn.foundation/v1/cypress'] } },
  blockExplorers: { default: { name: 'Klaytnscope', url: 'https://scope.klaytn.com' } },
};

// --- Definisi Chain Testnet (Baobab) ---
const kaiaTestnet = {
  ...klaytn,
  id: 1001,
  name: 'Kaia Testnet (Baobab)',
  nativeCurrency: { name: 'Kaia', symbol: 'KAIA', decimals: 18 },
  rpcUrls: { default: { http: ['https://public-node-api.klaytn.foundation/v1/baobab'] } },
  blockExplorers: { default: { name: 'Klaytnscope Baobab', url: 'https://baobab.scope.klaytn.com' } },
};

// Pilih chain aktif berdasarkan environment variable
const activeChain = process.env.NEXT_PUBLIC_CHAIN_NAME === 'mainnet' 
  ? kaiaMainnet 
  : kaiaTestnet;

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("WalletConnect Project ID is not defined in .env.local");
}

export const config = createConfig({
  chains: [activeChain], // Chain menjadi dinamis
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId, showQrModal: true }),
  ],
  transports: {
    [activeChain.id]: http(), // Transport juga menjadi dinamis
  },
  ssr: true,
});