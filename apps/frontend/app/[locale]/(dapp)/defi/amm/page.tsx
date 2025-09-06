// apps/frontend/app/(dapp)/defi/amm/page.tsx
'use client';

import { LiquidityPanel } from "@/app/(dapp)/defi/LiquidityPanel";

// Di dunia nyata, data ini akan datang dari backend/smart contract
// Ganti dengan alamat kontrak asli Anda
const availablePools = [
  { 
    tokenA: { symbol: 'USDT', address: '0x...' as `0x${string}` },
    tokenB: { symbol: 'LINKA', address: '0x...' as `0x${string}` },
    pairAddress: '0x...' as `0x${string}`
  },
  { 
    tokenA: { symbol: 'USDT', address: '0x...' as `0x${string}` },
    tokenB: { symbol: 'KAIA', address: '0x...' as `0x${string}` },
    pairAddress: '0x...' as `0x${string}`
  },
  { 
    tokenA: { symbol: 'USDT', address: '0x...' as `0x${string}` },
    tokenB: { symbol: 'ETH', address: '0x...' as `0x${string}` },
    pairAddress: '0x...' as `0x${string}`
  },
];

export default function AmmPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Penyedia Likuiditas (AMM)</h1>
        <p className="text-gray-500 mt-1">Dapatkan imbalan dengan menyediakan likuiditas untuk pasangan token favorit Anda.</p>
      </div>
      
      <div className="space-y-6">
        {availablePools.map(pool => (
          <LiquidityPanel 
            key={`${pool.tokenA.symbol}-${pool.tokenB.symbol}`}
            tokenA={pool.tokenA}
            tokenB={pool.tokenB}
            pairAddress={pool.pairAddress}
          />
        ))}
      </div>
    </div>
  );
}