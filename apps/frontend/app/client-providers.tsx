// apps/frontend/app/client-providers.tsx
"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createConfig,
  WagmiProvider,
  http,
  fallback,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

// --- Custom Kaia Kairos testnet chain definition
export const kaiaKairosTestnet = defineChain({
  id: 1001,
  name: "Kaia Kairos Testnet",
  network: "kairos",
  nativeCurrency: { name: "KAIA", symbol: "KAIA", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://public-en-kairos.node.kaia.io"],
      webSocket: ["wss://public-en-kairos.node.kaia.io/ws"],
    },
    public: {
      http: ["https://public-en-kairos.node.kaia.io"],
    },
  },
  blockExplorers: {
    default: { name: "Kairos Explorer", url: "https://kairos.kaiascope.com" },
  },
  testnet: true,
} as const);

// --- React Query client
const queryClient = new QueryClient();

// --- Wagmi config: use the Kaia chain + injected connector (MetaMask/Kaia Wallet)
// You can add other connectors (WalletConnect, etc.) later.
const wagmiConfig = createConfig({
  chains: [kaiaKairosTestnet],
  // transports: map chain id -> transport. fallback allows multiple RPCs if you add them.
  transports: {
    [kaiaKairosTestnet.id]: http("https://public-en-kairos.node.kaia.io"),
  },
  connectors: [injected()],
  // ssr: true, // enable if you need SSR support
});

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}