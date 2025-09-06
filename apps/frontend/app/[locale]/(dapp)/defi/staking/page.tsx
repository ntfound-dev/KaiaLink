// apps/frontend/app/(dapp)/defi/staking/page.tsx
'use client';

import { StakingPanel } from "@/app/(dapp)/defi/StakingPanel";

// Data ini mendefinisikan "farm" yang tersedia.
// `pid` adalah pool id di kontrak MasterChef.
// `lpToken` adalah nama dan alamat dari LP token yang di-stake.
const availableFarms = [
  {
    pid: 0,
    lpToken: {
      name: 'USDT/LINKA LP',
      address: '0x..._usdt_linka_lp_address' as `0x${string}`
    }
  },
  {
    pid: 1,
    lpToken: {
      name: 'USDT/KAIA LP',
      address: '0x..._usdt_kaia_lp_address' as `0x${string}`
    }
  },
  {
    pid: 2,
    lpToken: {
      name: 'USDT/ETH LP',
      address: '0x..._usdt_eth_lp_address' as `0x${string}`
    }
  },
];

export default function StakingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Yield Farming (Staking)</h1>
        <p className="text-gray-500 mt-1">Stake LP token Anda untuk mendapatkan imbalan (reward) berupa token LINKA.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availableFarms.map(farm => (
          <StakingPanel 
            key={farm.pid}
            poolId={farm.pid}
            lpToken={farm.lpToken}
          />
        ))}
      </div>
    </div>
  );
}