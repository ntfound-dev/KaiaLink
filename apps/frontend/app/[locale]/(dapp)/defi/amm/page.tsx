'use client';

import React from 'react';
import { useDeFiConfig } from '@/hooks/useDeFiConfig'; // hook yang saya sarankan sebelumnya
import { LiquidityPanel } from '@/components/defi/LiquidityPanel';
import styles from '@/styles/liquidity.module.css'; // optional: hapus jika tidak pakai module css

import type { Pool, Address } from '@/types/shared';

export default function AmmPage(): JSX.Element {
  const { data: defiConfig, isLoading, error, refetch } = useDeFiConfig();

  if (isLoading) {
    // simple skeleton: 3 placeholder panels
    return (
      <div className="space-y-6 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-2/5 bg-gray-200 rounded" />
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 rounded-lg bg-white shadow p-4 border" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 text-red-600">Gagal memuat konfigurasi DeFi: {String((error as any)?.message ?? error)}</div>
        <button
          onClick={() => void refetch()}
          className="inline-block rounded bg-blue-600 px-4 py-2 text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const availablePools: Pool[] = Array.isArray(defiConfig?.pools) ? (defiConfig!.pools as Pool[]) : [];

  if (availablePools.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Liquidity Pools</h2>
        <p className="text-gray-500">Tidak ada liquidity pool tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">AMM — Liquidity Pools</h1>
        <p className="text-sm text-gray-500">Pilih pool untuk menambah atau menarik likuiditas.</p>
      </header>

      <section className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {availablePools.map((pool: Pool, idx: number) => {
          // Defensive resolution of addresses & symbols (API may use different keys)
          const tokenAAddr = (pool.tokenAAddress ?? pool.tokenAddressA ?? pool.token0 ?? pool.tokenA ?? '') as unknown as Address;
          const tokenBAddr = (pool.tokenBAddress ?? pool.tokenAddressB ?? pool.token1 ?? pool.tokenB ?? '') as unknown as Address;
          const pairAddr = (pool.pairAddress ?? pool.pair ?? `${tokenAAddr}-${tokenBAddr}`) as unknown as Address;

          const tokenA = {
            symbol: (pool.tokenASymbol ?? pool.tokenA ?? pool.symbolA ?? pool.tokenSymbolA ?? '').toString(),
            address: tokenAAddr,
          };
          const tokenB = {
            symbol: (pool.tokenBSymbol ?? pool.tokenB ?? pool.symbolB ?? pool.tokenSymbolB ?? '').toString(),
            address: tokenBAddr,
          };

          const key = pairAddr || `pool-${idx}`;

          return (
            <div key={key} className={styles?.panel ? styles.panel : ''}>
              <LiquidityPanel tokenA={tokenA} tokenB={tokenB} pairAddress={pairAddr} />
            </div>
          );
        })}
      </section>
    </main>
  );
}
