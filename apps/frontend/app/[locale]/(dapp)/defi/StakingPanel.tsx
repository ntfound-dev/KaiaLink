// apps/frontend/components/defi/StakingPanel.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
// import { useStakingPool } from '@/hooks/useStakingPool'; // Hook ini perlu dibuat

interface StakingPanelProps {
  poolId: number;
  lpToken: {
    name: string;
    address: `0x${string}`;
  };
}

export function StakingPanel({ poolId, lpToken }: StakingPanelProps) {
  const [amount, setAmount] = useState('');
  
  // const { 
  //   stakedBalance, 
  //   rewards, 
  //   approve, 
  //   stake, 
  //   unstake, 
  //   harvest,
  //   needsApproval,
  //   isLoading 
  // } = useStakingPool(poolId, lpToken.address);

  // Placeholder data
  const stakedBalance = 120.5;
  const rewards = 45.8;
  const needsApproval = parseFloat(amount || "0") > 0;
  const isLoading = false;

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="font-bold text-lg mb-2">Stake {lpToken.name}</h3>
      
      <div className="flex justify-between mb-4 text-sm">
        <div>
          <p className="text-gray-500">Staked</p>
          <p className="font-bold">{stakedBalance.toFixed(2)} LP</p>
        </div>
        <div>
          <p className="text-gray-500">Rewards</p>
          <p className="font-bold text-green-500">{rewards.toFixed(4)} LINKA</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full p-2 border rounded"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button isLoading={isLoading} >
            {needsApproval ? `Approve` : 'Stake'}
          </Button>
          <Button isLoading={isLoading} variant="secondary" >
            Unstake
          </Button>
        </div>
        <Button variant="secondary" className="w-full">
          Harvest Rewards
        </Button>
      </div>
    </div>
  );
}