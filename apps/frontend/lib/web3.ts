// apps/frontend/lib/web3.ts
export interface MinimalChain {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[] } };
  blockExplorers: { default: { name: string; url: string } };
}

export const kaiaMainnet: MinimalChain = {
  id: 8217,
  name: 'Kaia Mainnet',
  nativeCurrency: { name: 'Kaia', symbol: 'KAIA', decimals: 18 },
  rpcUrls: { default: { http: ['https://public-node-api.klaytn.foundation/v1/cypress'] } },
  blockExplorers: { default: { name: 'Klaytnscope', url: 'https://scope.klaytn.com' } },
};

export const kaiaTestnet: MinimalChain = {
  id: 1001,
  name: 'Kaia Testnet (Baobab)',
  nativeCurrency: { name: 'Kaia', symbol: 'KAIA', decimals: 18 },
  rpcUrls: { default: { http: ['https://public-node-api.klaytn.foundation/v1/baobab'] } },
  blockExplorers: { default: { name: 'Klaytnscope Baobab', url: 'https://baobab.scope.klaytn.com' } },
};

export const activeChain: MinimalChain =
  process.env.NEXT_PUBLIC_CHAIN_NAME === 'mainnet' ? kaiaMainnet : kaiaTestnet;

export function getWalletConnectProjectId(): string {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';
}

export default {
  activeChain,
  getWalletConnectProjectId,
};
