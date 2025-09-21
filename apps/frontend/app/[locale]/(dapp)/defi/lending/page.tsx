'use client';

import React from 'react';
import { useDeFiConfig } from '@/hooks/useDeFiConfig';
import LendingMarketPanel from '@/components/defi/LendingMarketPanel';

export default function LendingPage() {
  const { data: defiConfig, isLoading, error, refetch } = useDeFiConfig();

  if (isLoading) return <div className="p-6">Memuat market lending...</div>;
  if (error)
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">Gagal memuat konfigurasi lending: {(error as any)?.message ?? String(error)}</div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => void refetch()}>
          Coba lagi
        </button>
      </div>
    );

  // prefer config.lending or config.markets or fallback to predefined list
  const markets = Array.isArray(defiConfig?.markets) ? defiConfig!.markets : defiConfig?.lending ?? [];

  if (!markets || markets.length === 0) {
    return <div className="p-6">Belum ada market lending tersedia.</div>;
  }

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Markets — Lending</h1>
        <p className="text-sm text-gray-500">Deposit, borrow, dan cek APY setiap asset.</p>
      </header>

      <section className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {markets.map((m: any, idx: number) => {
          const market = {
            asset: (m.assetSymbol ?? m.symbol ?? m.asset ?? `Asset-${idx}`).toString(),
            supplyApy: Number(m.supplyApy ?? m.supply_apr ?? m.apy ?? 0),
            borrowApy: Number(m.borrowApy ?? m.borrow_apr ?? m.borrow_apr ?? 0),
            // pass raw market object if needed by panel/hook
            _raw: m,
          };
          return <LendingMarketPanel key={market.asset + idx} market={market} />;
        })}
      </section>
    </main>
  );
}
