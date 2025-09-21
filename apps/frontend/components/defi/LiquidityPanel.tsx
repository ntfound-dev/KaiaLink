'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useLiquidityPool } from '@/hooks/useLiquidityPool';
import styles from '@/styles/liquidity.module.css';

interface TokenInfo {
  symbol: string;
  address: `0x${string}`;
}

interface LiquidityPanelProps {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  pairAddress: `0x${string}`;
}

/** Small helper: try to coerce numbers, strings, ethers BigNumber, etc. */
function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  // BigNumber-ish objects
  try {
    // ethers BigNumber: has toString()
    if (typeof value.toNumber === 'function') return value.toNumber();
    if (typeof value.toString === 'function') {
      const n = Number(value.toString());
      return Number.isFinite(n) ? n : 0;
    }
  } catch (e) {
    // fallthrough
  }
  return 0;
}

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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function LiquidityPanel({ tokenA, tokenB, pairAddress }: LiquidityPanelProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [approvingToken, setApprovingToken] = useState<null | 'A' | 'B'>(null);

  const {
    balanceA,
    balanceB,
    allowanceA,
    allowanceB,
    approve,
    addLiquidity,
    isLoading, // adding liquidity
    isLoadingData,
  } = useLiquidityPool(tokenA.address, tokenB.address, pairAddress);

  const numericBalanceA = useMemo(() => toNumber(balanceA), [balanceA]);
  const numericBalanceB = useMemo(() => toNumber(balanceB), [balanceB]);
  const numericAllowanceA = useMemo(() => toNumber(allowanceA), [allowanceA]);
  const numericAllowanceB = useMemo(() => toNumber(allowanceB), [allowanceB]);

  const requestedA = useMemo(() => Math.max(0, Number(amountA || 0)), [amountA]);
  const requestedB = useMemo(() => Math.max(0, Number(amountB || 0)), [amountB]);

  const needsApprovalA = numericAllowanceA < requestedA;
  const needsApprovalB = numericAllowanceB < requestedB;

  useEffect(() => {
    // validate inputs lightly
    setLocalError(null);
    if (amountA && Number(amountA) < 0) setLocalError('Jumlah token A tidak boleh negatif.');
    if (amountB && Number(amountB) < 0) setLocalError('Jumlah token B tidak boleh negatif.');
  }, [amountA, amountB]);

  const handleApprove = async (which: 'A' | 'B') => {
    try {
      setLocalError(null);
      setApprovingToken(which);
      const addr = which === 'A' ? tokenA.address : tokenB.address;
      await approve(addr);
      // approve() should update allowance via hook; no manual update here
    } catch (err: any) {
      setLocalError(err?.message ? String(err.message) : 'Gagal approve token.');
    } finally {
      setApprovingToken(null);
    }
  };

  const handleAddLiquidity = async () => {
    setLocalError(null);

    // basic client validation
    if (!amountA || Number(amountA) <= 0) {
      setLocalError(`Masukkan jumlah ${tokenA.symbol} yang valid.`);
      return;
    }
    if (!amountB || Number(amountB) <= 0) {
      setLocalError(`Masukkan jumlah ${tokenB.symbol} yang valid.`);
      return;
    }
    if (requestedA > numericBalanceA) {
      setLocalError(`Saldo ${tokenA.symbol} tidak mencukupi.`);
      return;
    }
    if (requestedB > numericBalanceB) {
      setLocalError(`Saldo ${tokenB.symbol} tidak mencukupi.`);
      return;
    }

    try {
      // If any approval needed, run approve for the first needed token
      if (needsApprovalA) {
        await handleApprove('A');
        return;
      }
      if (needsApprovalB) {
        await handleApprove('B');
        return;
      }

      await addLiquidity(amountA, amountB);
      // Optionally: clear inputs or show success state
      setAmountA('');
      setAmountB('');
    } catch (err: any) {
      setLocalError(err?.message ? String(err.message) : 'Gagal menambahkan likuiditas.');
    }
  };

  if (isLoadingData) {
    return <div className="p-4 border rounded-lg text-center">Memuat data pool...</div>;
  }

  return (
    <div className="p-4 border rounded-xl bg-white shadow-lg">
      <h3 className="text-xl font-bold mb-3">
        Pool: {tokenA.symbol}/{tokenB.symbol}
      </h3>

      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
          }`}
        >
          Tambah Likuiditas
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'remove' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
          }`}
        >
          Tarik Likuiditas
        </button>
      </div>

      {activeTab === 'add' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Sediakan kedua token untuk mendapatkan imbalan fee.</p>

          <div className="bg-gray-50 p-2 rounded-lg border">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{tokenA.symbol}</span>
              <span>Saldo: {numericBalanceA.toFixed(4)}</span>
            </div>
            <input
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              className="w-full text-xl bg-transparent focus:outline-none"
            />
          </div>

          <div className="bg-gray-50 p-2 rounded-lg border">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{tokenB.symbol}</span>
              <span>Saldo: {numericBalanceB.toFixed(4)}</span>
            </div>
            <input
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.0"
              className="w-full text-xl bg-transparent focus:outline-none"
            />
          </div>

          {localError && <div className="text-red-600 text-sm">{localError}</div>}

          {/* If approvals are needed, show explicit small buttons (optional) */}
          <div className="flex gap-2">
            {needsApprovalA && (
              <Button
                onClick={() => handleApprove('A')}
                disabled={approvingToken === 'A' || isLoading}
                className="flex-1 h-10 text-sm"
              >
                {approvingToken === 'A' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Approving {tokenA.symbol}...
                  </span>
                ) : (
                  `Approve ${tokenA.symbol}`
                )}
              </Button>
            )}

            {needsApprovalB && (
              <Button
                onClick={() => handleApprove('B')}
                disabled={approvingToken === 'B' || isLoading}
                className="flex-1 h-10 text-sm"
              >
                {approvingToken === 'B' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Approving {tokenB.symbol}...
                  </span>
                ) : (
                  `Approve ${tokenB.symbol}`
                )}
              </Button>
            )}
          </div>

          {/* Primary action button */}
          <Button
            onClick={handleAddLiquidity}
            disabled={
              isLoading ||
              approvingToken !== null ||
              Number(amountA) <= 0 ||
              Number(amountB) <= 0
            }
            className="w-full !mt-4 h-11 text-base"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Memproses...
              </span>
            ) : needsApprovalA ? (
              `Approve ${tokenA.symbol}`
            ) : needsApprovalB ? (
              `Approve ${tokenB.symbol}`
            ) : (
              'Sediakan Likuiditas'
            )}
          </Button>
        </div>
      )}

      {activeTab === 'remove' && (
        <div>
          <p className="text-center text-gray-500 p-8">Fungsionalitas penarikan likuiditas sedang dikembangkan.</p>
        </div>
      )}
    </div>
  );
}

export default LiquidityPanel;
