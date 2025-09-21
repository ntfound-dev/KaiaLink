'use client';

import React from 'react';
import AirdropPanel from '@/components/ui/AirdropPanel';
import { useAirdrop } from '@/hooks/useAirdrop';

export default function AirdropPage() {
  const { data, isLoading, claim, isClaiming, claimError } = useAirdrop();

  // business rule: disable claim button until TGE (example: always disabled for now)
  // you can change logic to: const claimDisabled = !isTgeLive;
  const claimDisabled = true; // example: disable until TGE

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Klaim Airdrop LINKA</h1>
      <AirdropPanel
        data={data}
        isLoading={isLoading}
        onClaim={claim}
        isClaiming={isClaiming}
        claimDisabled={claimDisabled}
        claimError={claimError}
      />
    </main>
  );
}
