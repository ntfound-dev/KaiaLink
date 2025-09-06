'use client';

import { LendingMarketPanel } from "@/components/defi/LendingMarketPanel";

// Ganti dengan data market asli Anda
const availableMarkets = [
  { asset: 'USDT', supplyApy: 7.5, borrowApy: 10.3 },
  { asset: 'LINKA', supplyApy: 6.8, borrowApy: 9.5 },
  { asset: 'KAIA', supplyApy: 5.2, borrowApy: 8.1 },
];

export default function LendingPage() {
  return (
    <div className="space-y-6 mt-4">
      {availableMarkets.map(market => (
        <LendingMarketPanel key={market.asset} market={market} />
      ))}
    </div>
  );
}