// apps/frontend/components/defi/LendingMarketPanel.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
// import { useLendingMarket } from '@/hooks/useLendingMarket'; // Uncomment & adapt signature if you have this hook

interface LendingMarketPanelProps {
  market: {
    asset: string;
    supplyApy: number;
    borrowApy: number;
  };
}

/** try to coerce number-like values (string, number, BigNumber-like) into number */
function toNumber(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  try {
    if (typeof v.toNumber === 'function') return v.toNumber();
    if (typeof v.toString === 'function') {
      const n = Number(v.toString());
      return Number.isFinite(n) ? n : 0;
    }
  } catch {}
  return 0;
}

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="img">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/**
 * LendingMarketPanel
 *
 * Notes:
 * - If you have a `useLendingMarket` hook, uncomment the import above and the block below,
 *   and adapt the call to the hook's expected signature (it may require more than 1 arg).
 *
 * Example hook usage (adjust signature to your hook):
 *
 * const {
 *   userSuppliedBalance,
 *   userBorrowedBalance,
 *   allowance,
 *   approve,
 *   supply,
 *   withdraw,
 *   borrow,
 *   repay,
 *   isLoading,
 *   isLoadingData,
 * } = useLendingMarket(market.asset, options);
 *
 * If the hook requires 2 args, pass the second argument (options) as appropriate.
 */
export default function LendingMarketPanel({ market }: LendingMarketPanelProps) {
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // ---------- Placeholder / fallback values (so file compiles) ----------
  // Replace these placeholders with your hook return values when integrating.
  const userSuppliedBalanceRaw = 123.45; // could be BigNumber/string/number
  const userBorrowedBalanceRaw = 10.2;
  const allowanceRaw = 1000; // allowance of token for supply
  const isLoadingData = false;
  const isLoading = localLoading;

  // Mock action functions (replace with actual functions from hook)
  const approve = async (amt?: string) => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      // call hook.approve(amt) if available
      await new Promise((r) => setTimeout(r, 900));
    } catch (e: any) {
      setLocalError(e?.message ?? 'Approve gagal');
    } finally {
      setLocalLoading(false);
    }
  };

  const supply = async (amt: string) => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      // call hook.supply(amt)
      await new Promise((r) => setTimeout(r, 900));
      setSupplyAmount('');
    } catch (e: any) {
      setLocalError(e?.message ?? 'Supply gagal');
    } finally {
      setLocalLoading(false);
    }
  };

  const withdraw = async (amt: string) => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      // call hook.withdraw(amt)
      await new Promise((r) => setTimeout(r, 900));
    } catch (e: any) {
      setLocalError(e?.message ?? 'Withdraw gagal');
    } finally {
      setLocalLoading(false);
    }
  };

  const borrow = async (amt: string) => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      // call hook.borrow(amt)
      await new Promise((r) => setTimeout(r, 900));
      setBorrowAmount('');
    } catch (e: any) {
      setLocalError(e?.message ?? 'Borrow gagal');
    } finally {
      setLocalLoading(false);
    }
  };

  const repay = async (amt: string) => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      // call hook.repay(amt)
      await new Promise((r) => setTimeout(r, 900));
    } catch (e: any) {
      setLocalError(e?.message ?? 'Repay gagal');
    } finally {
      setLocalLoading(false);
    }
  };

  // ---------- Coerce numerics ----------
  const userSuppliedBalance = toNumber(userSuppliedBalanceRaw);
  const userBorrowedBalance = toNumber(userBorrowedBalanceRaw);
  const allowance = toNumber(allowanceRaw);

  const needsApproval = allowance < (parseFloat(supplyAmount || '0') || 0);

  // ---------- Handlers ----------
  const handleSupply = async () => {
    setLocalError(null);
    if (!supplyAmount || Number(supplyAmount) <= 0) {
      setLocalError('Masukkan jumlah supply yang valid.');
      return;
    }
    if (needsApproval) {
      await approve(supplyAmount);
      return;
    }
    await supply(supplyAmount);
  };

  const handleWithdraw = async () => {
    if (!supplyAmount || Number(supplyAmount) <= 0) {
      setLocalError('Masukkan jumlah withdraw yang valid.');
      return;
    }
    await withdraw(supplyAmount);
  };

  const handleBorrow = async () => {
    if (!borrowAmount || Number(borrowAmount) <= 0) {
      setLocalError('Masukkan jumlah borrow yang valid.');
      return;
    }
    await borrow(borrowAmount);
  };

  const handleRepay = async () => {
    if (!borrowAmount || Number(borrowAmount) <= 0) {
      setLocalError('Masukkan jumlah repay yang valid.');
      return;
    }
    await repay(borrowAmount);
  };

  if (isLoadingData) {
    return <div className="p-4 border rounded-lg text-center">Memuat data market...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-3">{market.asset} Market</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SUPPLY */}
        <div className="p-3 bg-green-50 rounded-md">
          <h4 className="font-semibold mb-2">Deposit (Supply)</h4>
          <p className="text-sm">
            APY: <span className="font-bold text-green-600">{market.supplyApy}%</span>
          </p>
          <p className="text-sm">Saldo Deposit Anda: ${userSuppliedBalance.toFixed(2)}</p>

          <div className="mt-3 space-y-2">
            <input
              type="number"
              placeholder={`0.0 ${market.asset}`}
              className="w-full p-2 border rounded"
              value={supplyAmount}
              onChange={(e) => setSupplyAmount(e.target.value)}
              min="0"
              step="any"
            />

            <Button
              onClick={handleSupply}
              disabled={isLoading || localLoading || !supplyAmount || Number(supplyAmount) <= 0}
              className="w-full"
              size="sm"
            >
              {isLoading || localLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> {needsApproval ? `Processing...` : 'Processing...'}
                </span>
              ) : needsApproval ? (
                `Approve ${market.asset}`
              ) : (
                'Supply'
              )}
            </Button>

            <Button
              onClick={handleWithdraw}
              disabled={isLoading || localLoading || !supplyAmount || Number(supplyAmount) <= 0}
              className="w-full"
              size="sm"
              // variant="secondary" // keep if your Button supports `variant`
            >
              {isLoading || localLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Withdrawing...
                </span>
              ) : (
                'Withdraw'
              )}
            </Button>
          </div>
        </div>

        {/* BORROW */}
        <div className="p-3 bg-red-50 rounded-md">
          <h4 className="font-semibold mb-2">Pinjam (Borrow)</h4>
          <p className="text-sm">
            APY: <span className="font-bold text-red-600">{market.borrowApy}%</span>
          </p>
          <p className="text-sm">Pinjaman Anda: ${userBorrowedBalance.toFixed(2)}</p>

          <div className="mt-3 space-y-2">
            <input
              type="number"
              placeholder={`0.0 ${market.asset}`}
              className="w-full p-2 border rounded"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              min="0"
              step="any"
            />

            <Button
              onClick={handleBorrow}
              disabled={isLoading || localLoading || !borrowAmount || Number(borrowAmount) <= 0}
              className="w-full"
              size="sm"
            >
              {isLoading || localLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Borrowing...
                </span>
              ) : (
                'Borrow'
              )}
            </Button>

            <Button
              onClick={handleRepay}
              disabled={isLoading || localLoading || !borrowAmount || Number(borrowAmount) <= 0}
              className="w-full"
              size="sm"
            >
              {isLoading || localLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Repaying...
                </span>
              ) : (
                'Repay'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm">
        <p>
          Health Factor: <span className="font-bold">1.8</span> (Jaga di atas 1.0)
        </p>
        {localError && <p className="text-red-600 text-sm mt-2">{localError}</p>}
      </div>
    </div>
  );
}
