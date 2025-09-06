'use client';

import { LiquidityPanel } from "@/components/defi/LiquidityPanel";

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
];

export default function AmmPage() {
  return (
    <div className="space-y-6 mt-4">
      {availablePools.map(pool => (
        <LiquidityPanel
          key={`${pool.tokenA.symbol}-${pool.tokenB.symbol}`}
          tokenA={pool.tokenA}
          tokenB={pool.tokenB}
          pairAddress={pool.pairAddress}
        />
      ))}
    </div>
  );
}