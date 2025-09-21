'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useStakingPool } from '@/hooks/useStakingPool';
import styles from '@/styles/staking.module.css'; // optional: buat file ini jika mau styling module

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
  /** Either provide poolId + lpToken or farm */
  poolId?: number | string;
  lpToken?: LPToken;
  farm?: Farm;
  /** stakingContract (spender) address — diperlukan untuk approve; jika tidak ada, component will attempt backend flow */
  stakingContract?: `0x${string}` | string | null;
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

export default function StakingPanel(props: StakingPanelProps): JSX.Element {
  const { poolId, lpToken, farm, stakingContract } = props;

  // Local UI state
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);

  // If farm mode -> simple view (keep same as before)
  if (farm) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold text-lg mb-2">Farm: {String(farm.id)}</h3>
        <p className="text-sm text-gray-600">Reward token: {farm.rewardToken ?? '-'}</p>
        <p className="text-sm text-gray-600">LP: {farm.lpName ?? '-'}</p>
      </div>
    );
  }

  // Basic prop validation
  if (poolId == null || lpToken == null) {
    return (
      <div className="p-4 border rounded bg-yellow-50 text-sm">
        <strong>StakingPanel:</strong> missing <code>poolId</code> or <code>lpToken</code> props. Provide them or pass a <code>farm</code> prop.
      </div>
    );
  }

  // -----------------------------------------------
  // Hook integration: useStakingPool(tokenAddress, poolId, opts)
  // NOTE: some hook typings might expect fewer args — to avoid TS "expected 0-2 args but got 3"
  // we call it through a permissive cast so we keep runtime behavior while avoiding compile error.
  // Prefer: update the hook's typing to accept (tokenAddr, poolId, opts) if that's the intended signature.
  // -----------------------------------------------
  const hookRes = (useStakingPool as unknown as (...args: any[]) => any)(
    lpToken.address,
    poolId,
    { stakingContract: stakingContract ?? undefined }
  );

  const {
    stakedBalance,
    rewards,
    stakedAsNumber,
    rewardsAsNumber,
    allowanceAsNumber,
    needsApproval: needsApprovalFn,
    approve,
    stake,
    unstake,
    harvest,
    isLoadingData,
    isLoading,
    error,
  } = hookRes ?? {};

  // derive UI flags & numbers (safe fallback to placeholders)
  const stakedDisplay = Number.isFinite(Number(stakedAsNumber)) ? Number(stakedAsNumber) : 0;
  const rewardsDisplay = Number.isFinite(Number(rewardsAsNumber)) ? Number(rewardsAsNumber) : 0;
  const allowanceDisplay = Number.isFinite(Number(allowanceAsNumber)) ? Number(allowanceAsNumber) : 0;

  // compute whether approval needed for current requested amount
  const requestedAmountNum = useMemo(() => {
    const n = Number(amount || 0);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [amount]);

  const needsApproval = useMemo(() => {
    try {
      // prefer hook-provided function
      if (typeof needsApprovalFn === 'function') return needsApprovalFn(requestedAmountNum);
      // fallback: compare allowance numeric
      return allowanceDisplay < requestedAmountNum;
    } catch {
      return false;
    }
  }, [needsApprovalFn, allowanceDisplay, requestedAmountNum]);

  useEffect(() => {
    setLocalError(null);
    if (amount && Number(amount) < 0) setLocalError('Jumlah tidak boleh negatif');
  }, [amount]);

  // Action handlers (use hook functions if available)
  const handleApprove = async () => {
    setLocalError(null);
    if (!approve) {
      setLocalError('Approve tidak tersedia (backend / hook belum diimplementasikan).');
      return;
    }
    if (!stakingContract) {
      // if spender not known, attempt approve with poolId-derived spender or show message
      setLocalError('Alamat kontrak staking tidak tersedia — tidak dapat melakukan approve. Pastikan backend menyediakan stakingContract.');
      return;
    }
    try {
      setIsProcessingLocal(true);
      await approve(stakingContract);
    } catch (e: any) {
      setLocalError(e?.message ?? 'Gagal approve');
    } finally {
      setIsProcessingLocal(false);
    }
  };

  const handleStake = async () => {
    setLocalError(null);
    const n = Number(amount || 0);
    if (!n || n <= 0) {
      setLocalError('Masukkan jumlah stake yang valid');
      return;
    }
    if (!stake) {
      setLocalError('Fungsi stake tidak tersedia (backend/hook belum diimplementasikan).');
      return;
    }
    try {
      setIsProcessingLocal(true);
      await stake(String(amount));
      setAmount('');
    } catch (e: any) {
      setLocalError(e?.message ?? 'Gagal stake');
    } finally {
      setIsProcessingLocal(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstake) {
      setLocalError('Fungsi unstake tidak tersedia.');
      return;
    }
    try {
      setIsProcessingLocal(true);
      await unstake(String(amount || '0'));
      setAmount('');
    } catch (e: any) {
      setLocalError(e?.message ?? 'Gagal unstake');
    } finally {
      setIsProcessingLocal(false);
    }
  };

  const handleHarvest = async () => {
    if (!harvest) {
      setLocalError('Fungsi harvest tidak tersedia.');
      return;
    }
    try {
      setIsProcessingLocal(true);
      await harvest();
    } catch (e: any) {
      setLocalError(e?.message ?? 'Gagal harvest');
    } finally {
      setIsProcessingLocal(false);
    }
  };

  // Loading state
  if (isLoadingData) {
    return <div className="p-4 border rounded-lg text-center">Memuat data pool...</div>;
  }

  return (
    <div className={`${styles?.panel ?? ''} p-4 border rounded-lg bg-white shadow-sm`}>
      <h3 className="font-bold text-lg mb-2">Stake {lpToken.name}</h3>

      <div className="flex justify-between mb-4 text-sm">
        <div>
          <p className="text-gray-500">Staked</p>
          <p className="font-bold">{stakedDisplay.toFixed(4)} LP</p>
        </div>
        <div>
          <p className="text-gray-500">Rewards</p>
          <p className="font-bold text-green-500">{rewardsDisplay.toFixed(6)} LINKA</p>
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
        {error && <div className="text-red-600 text-sm">Error: {(error as any)?.message ?? String(error)}</div>}

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={needsApproval ? handleApprove : handleStake}
            disabled={isProcessingLocal || isLoading || isLoadingData}
            className="h-10"
          >
            {(isProcessingLocal || isLoading) ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> {needsApproval ? 'Approving...' : 'Processing...'}
              </span>
            ) : needsApproval ? 'Approve' : 'Stake'}
          </Button>

          <Button
            onClick={handleUnstake}
            disabled={isProcessingLocal || isLoading || isLoadingData}
            variant="secondary"
            className="h-10"
          >
            {isProcessingLocal ? (
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
          disabled={isProcessingLocal || isLoading || isLoadingData}
          variant="secondary"
          className="w-full"
        >
          {isProcessingLocal ? (
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
