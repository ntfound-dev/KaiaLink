// apps/frontend/app/(dapp)/defi/lending/page.tsx
'use client';

import { LendingMarketPanel } from "@/app/(dapp)/defi/LendingMarketPanel";

// Di dunia nyata, data ini akan datang dari API backend atau smart contract
// Ganti dengan alamat kontrak asli Anda untuk setiap aset
const availableMarkets = [
  { 
    asset: 'USDT', 
    supplyApy: 7.5, 
    borrowApy: 10.3,
    // tokenAddress: '0x..._usdt_address', 
    // marketAddress: '0x..._cUsdt_address' 
  },
  { 
    asset: 'LINKA', 
    supplyApy: 6.8, 
    borrowApy: 9.5,
    // tokenAddress: '0x..._linka_address', 
    // marketAddress: '0x..._cLinka_address' 
  },
  { 
    asset: 'KAIA', 
    supplyApy: 5.2, 
    borrowApy: 8.1,
    // tokenAddress: '0x..._kaia_address', 
    // marketAddress: '0x..._cKaia_address' 
  },
];

export default function LendingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pasar Pinjaman (Lending)</h1>
        <p className="text-gray-500 mt-1">Dapatkan bunga dari aset Anda atau gunakan sebagai jaminan untuk meminjam.</p>
      </div>
      
      <div className="space-y-6">
        {availableMarkets.map(market => (
          // Komponen kita yang sudah fungsional akan digunakan di sini
          <LendingMarketPanel key={market.asset} market={market} />
        ))}
      </div>
    </div>
  );
}