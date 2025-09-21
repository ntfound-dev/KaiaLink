// apps/frontend/app/[locale]/(dapp)/defi/swap/page.tsx
'use client';

import React from 'react';
import SwapForm from '@/components/defi/SwapForm';
import { useDeFiConfig } from '@/hooks/useDeFiConfig';

export default function SwapPage() {
  const { data: defiConfig, isLoading } = useDeFiConfig();

  const routerAddress = defiConfig?.routerAddress ?? null;

  return (
    <main className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Swap</h1>
        <p className="text-sm text-gray-500">Tukar token dengan cepat.</p>
      </header>

      <div className="max-w-xl">
        <SwapForm routerAddress={routerAddress ?? undefined} />
      </div>
    </main>
  );
}
