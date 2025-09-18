/**
 * Lightweight web3 helpers — NO top-level imports from 'wagmi' or connectors.
 * This file only defines chain information and exposes helpers that client
 * code can call to dynamically import and initialize wagmi.
 */

/* --- Chain definitions --- */
export const kaiaMainnet = {
  id: 8217,
  name: 'Kaia Mainnet',
  nativeCurrency: { name: 'Kaia', symbol: 'KAIA', decimals: 18 },
  rpcUrls: { default: { http: ['https://public-node-api.klaytn.foundation/v1/cypress'] } },
  blockExplorers: { default: { name: 'Klaytnscope', url: 'https://scope.klaytn.com' } },
};

export const kaiaTestnet = {
  id: 1001,
  name: 'Kaia Testnet (Baobab)',
  nativeCurrency: { name: 'Kaia', symbol: 'KAIA', decimals: 18 },
  rpcUrls: { default: { http: ['https://public-node-api.klaytn.foundation/v1/baobab'] } },
  blockExplorers: { default: { name: 'Klaytnscope Baobab', url: 'https://baobab.scope.klaytn.com' } },
};

/* Active chain chosen by env variable (string compare to 'mainnet') */
export const activeChain = process.env.NEXT_PUBLIC_CHAIN_NAME === 'mainnet' ? kaiaMainnet : kaiaTestnet;

/* WalletConnect project id helper — do NOT throw here so server build doesn't crash */
export function getWalletConnectProjectId() {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';
}

/* Export any small helpers you might need client-side */
export default {
  activeChain,
  getWalletConnectProjectId,
};
