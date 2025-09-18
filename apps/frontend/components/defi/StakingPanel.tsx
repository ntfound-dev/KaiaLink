// apps/frontend/components/defi/StakingPanel.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
// import { useStakingPool } from '@/hooks/useStakingPool'; // uncomment jika ada

/** Optional: define Farm shape if you later want to pass `farm` prop */
export type Farm = {
  id: string | number;
  rewardToken?: string;
  lpName?: string;
  // add other fields you need
};

type LPToken = {
  name: string;
  address: `0x${string}`;
};

export type StakingPanelProps = {
  /** Either provide poolId + lpToken (normal mode) or farm (alternate mode) */
  poolId?: number;
  lpToken?: LPToken;
  farm?: Farm;
};

/** small spinner used in buttons (no css color hardcoded) */
function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/**
 * Single StakingPanel implementation (no duplicates).
 * - If useStakingPool hook exists, uncomment the hook block to use it.
 * - Otherwise this uses safe placeholder state so the component builds and can be tested.
 */
export default function StakingPanel(props: StakingPanelProps): JSX.Element {
  const { poolId, lpToken, farm } = props;

  // Local UI state
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Production hook (uncomment if available)
  // const {
  //   stakedBalance,
  //   rewards,
  //   needsApproval,
  //   approve,
  //   stake,
  //   unstake,
  //   harvest,
  //   isLoading: isHookLoading
  // } = useStakingPool(poolId!, lpToken!.address);

  // Fallback placeholders so component compiles without the hook
  const stakedBalance = useMemo(() => 120.5, []);
  const rewards = useMemo(() => 45.8123, []);
  const needsApproval = useMemo(() => parseFloat(amount || '0') > 0 && parseFloat(amount || '0') > stakedBalance * 10, [amount, stakedBalance]); // silly heuristic for UI
  const isHookLoading = false;

  useEffect(() => {
    setLocalError(null);
    if (amount && Number(amount) < 0) setLocalError('Jumlah tidak boleh negatif');
  }, [amount]);

  const handleApprove = async () => {
    try {
      setLocalError(null);
      setIsApproving(true);
      // if using hook: await approve();
      await new Promise((r) => setTimeout(r, 900)); // mock delay
    } catch (e: any) {
      setLocalError(e?.message ?? 'Gagal approve');
    } finally {
      setIsApproving(false);
    }
  };

  const handleStake = async () => {
    setLocalError(null);
    const n = Number(amount || 0);
    if (!n || n <= 0) {
      setLocalError('Masukkan jumlah stake yang valid');
      return;
    }

    try {
      setIsProcessing(true);
      // if using hook: await stake(amount);
      await new Promise((r) => setTimeout(r, 900)); // mock delay
      setAmount('');
    } catch (e: any) {
      setLocalError(e?.message ?? 'Gagal stake');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnstake = async () => {
    try {
      setIsProcessing(true);
      // if using hook: await unstake(...)
      await new Promise((r) => setTimeout(r, 900));
    } catch (e: any) {
      setLocalError(e?.message ?? 'Gagal unstake');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHarvest = async () => {
    try {
      setIsProcessing(true);
      // if using hook: await harvest();
      await new Promise((r) => setTimeout(r, 900));
    } catch (e: any) {
      setLocalError(e?.message ?? 'Gagal harvest');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render alternate farm view when farm prop present
  if (farm) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold text-lg mb-2">Farm: {String(farm.id)}</h3>
        <p className="text-sm text-gray-600">Reward token: {farm.rewardToken ?? '-'}</p>
        <p className="text-sm text-gray-600">LP: {farm.lpName ?? '-'}</p>
      </div>
    );
  }

  // If neither poolId nor lpToken provided, inform developer
  if (poolId == null || lpToken == null) {
    return (
      <div className="p-4 border rounded bg-yellow-50 text-sm">
        <strong>StakingPanel:</strong> missing <code>poolId</code> or <code>lpToken</code> props. Provide them or pass a <code>farm</code> prop.
      </div>
    );
  }

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
          inputMode="decimal"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full p-2 border rounded"
        />

        {localError && <div className="text-red-600 text-sm">{localError}</div>}

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={needsApproval ? handleApprove : handleStake}
            disabled={isApproving || isProcessing || isHookLoading}
            className="h-10"
          >
            {(isApproving || isProcessing || isHookLoading) ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> {isApproving ? 'Approving...' : isProcessing ? 'Processing...' : 'Loading...'}
              </span>
            ) : needsApproval ? 'Approve' : 'Stake'}
          </Button>

          <Button
            onClick={handleUnstake}
            disabled={isProcessing || isHookLoading}
            variant="secondary"
            className="h-10"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Unstaking...
              </span>
            ) : (
              'Unstake'
            )}
          </Button>
        </div>

        <Button
          onClick={handleHarvest}
          disabled={isProcessing || isHookLoading}
          variant="secondary"
          className="w-full"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Harvesting...
            </span>
          ) : (
            'Harvest Rewards'
          )}
        </Button>
      </div>
    </div>
  );
}
