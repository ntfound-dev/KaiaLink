'use client';

import { StakingPanel } from "@/components/defi/StakingPanel";

// Ganti dengan data farm asli Anda
const availableFarms = [
  {
    pid: 0,
    lpToken: {
      name: 'USDT/LINKA LP',
      address: '0x...' as `0x${string}`
    }
  },
  {
    pid: 1,
    lpToken: {
      name: 'USDT/KAIA LP',
      address: '0x...' as `0x${string}`
    }
  },
];

export default function StakingPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {availableFarms.map(farm => (
        <StakingPanel
          key={farm.pid}
          poolId={farm.pid}
          lpToken={farm.lpToken}
        />
      ))}
    </div>
  );
}