// apps/frontend/components/defi/SwapForm.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowDownUp, Settings2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import useSwap from '@/hooks/useSwap';

// Placeholder token list (sama seperti sebelumnya)
const TOKEN_LIST = [
  { symbol: 'USDT', name: 'Tether USD', address: '0x0000000000000000000000000000000000000001' as `0x${string}`, logoURI: '/tokens/usdt.png' },
  { symbol: 'LINKA', name: 'KaiaLink Token', address: '0x0000000000000000000000000000000000000002' as `0x${string}`, logoURI: '/tokens/linka.png' },
  { symbol: 'KAIA', name: 'Kaia', address: '0x0000000000000000000000000000000000000003' as `0x${string}`, logoURI: '/tokens/kaia.png' },
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000004' as `0x${string}`, logoURI: '/tokens/eth.png' },
];

export type SwapFormProps = {
  routerAddress?: `0x${string}` | string;
  readOptions?: any;
  oneUnit?: bigint;
};

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="img">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function SwapForm(props: SwapFormProps): JSX.Element {
  const { routerAddress } = props;

  const [amountIn, setAmountIn] = useState('');
  const [tokenIn, setTokenIn] = useState(TOKEN_LIST[0]);
  const [tokenOut, setTokenOut] = useState(TOKEN_LIST[1]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'in' | 'out'>('in');

  // slippage UI state
  const SLIPPAGE_PRESETS = [0.1, 0.5, 1]; // percents
  const [selectedSlippage, setSelectedSlippage] = useState<number>(0.5);
  const [isCustomSlippage, setIsCustomSlippage] = useState(false);
  const [customSlippageValue, setCustomSlippageValue] = useState<string>('0.5');

  const {
    balanceIn,
    amountOut,
    amountOutRaw,
    estimateMinReceived,
    needsApproval,
    approve,
    swap,
    isLoading,
  } = useSwap(tokenIn, tokenOut, amountIn, { routerAddress });

  const balanceDisplay = useMemo(() => {
    try {
      if (typeof balanceIn === 'number') return balanceIn.toLocaleString();
      if (typeof balanceIn === 'string') return Number(balanceIn) === 0 ? '0' : Number(balanceIn).toLocaleString();
      return String(balanceIn);
    } catch {
      return '0';
    }
  }, [balanceIn]);

  const openTokenModal = (forWhich: 'in' | 'out') => {
    setSelectingFor(forWhich);
    setIsModalOpen(true);
  };

  const handleSelectToken = (token: typeof TOKEN_LIST[0]) => {
    if (selectingFor === 'in') {
      if (token.address === tokenOut.address) {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);
      } else {
        setTokenIn(token);
      }
    } else {
      if (token.address === tokenIn.address) {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);
      } else {
        setTokenOut(token);
      }
    }
    setIsModalOpen(false);
  };

  const handleSwapTokens = () => {
    setTokenIn(prev => {
      setTokenOut(prev === tokenOut ? tokenIn : tokenOut);
      return tokenOut;
    });
  };

  // compute effective slippage percent
  const slippagePercent = isCustomSlippage ? Number(customSlippageValue || 0) : selectedSlippage;

  // compute min received estimate using hook helper (best when amountOutRaw present)
  const minReceivedEstimate = useMemo(() => {
    if (!amountOut) return '';
    // prefer hook's precise BN-based estimate:
    const est = estimateMinReceived(slippagePercent);
    if (est) return est;
    // fallback: parse amountOut numeric
    try {
      const outNum = parseFloat(String(amountOut || '0'));
      if (!Number.isFinite(outNum)) return '';
      const minNum = outNum * (1 - slippagePercent / 100);
      // format with reasonable precision
      return minNum.toLocaleString(undefined, { maximumFractionDigits: 8 });
    } catch {
      return '';
    }
  }, [amountOut, amountOutRaw, estimateMinReceived, slippagePercent]);

  const actionDisabled = !amountIn || Number(amountIn) <= 0 || isLoading;

  const handleActionClick = async () => {
    try {
      if (needsApproval) {
        if (typeof approve === 'function') {
          await approve();
        }
        return;
      }
      if (typeof swap === 'function') {
        // pass slippage percent to swap (backend or on-chain fallback)
        await swap(Number(slippagePercent));
      }
    } catch (err: any) {
      // show simple alert for now; replace with toast if you have one
      alert(`Swap gagal: ${err?.message ?? String(err)}`);
    }
  };

  return (
    <div className="p-4 border rounded-xl max-w-md mx-auto relative bg-white shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl">Tukar Aset</h2>
        <button className="text-gray-500 hover:text-gray-800" aria-label="Settings">
          <Settings2 size={20} />
        </button>
      </div>

      {/* INPUT TOKEN */}
      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Dari</span>
          <span>Saldo: {balanceDisplay}</span>
        </div>
        <div className="flex items-center justify-between mt-1 gap-3">
          <input
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="0.0"
            className="text-2xl bg-transparent w-full focus:outline-none"
            min="0"
            step="any"
          />
          <button onClick={() => openTokenModal('in')} className="flex items-center font-bold bg-white p-2 rounded-lg shadow-sm hover:bg-gray-50">
            <Image src={tokenIn.logoURI} alt={tokenIn.symbol} width={24} height={24} className="mr-2 rounded-full" />
            <span className="mr-2">{tokenIn.symbol}</span>
            <span className="text-xs">▼</span>
          </button>
        </div>
      </div>

      {/* Tombol Pembalik */}
      <div className="flex justify-center my-[-12px] relative z-10">
        <button onClick={handleSwapTokens} className="text-2xl bg-gray-200 p-2 rounded-full border-4 border-white hover:bg-gray-300" aria-label="Swap tokens">
          <ArrowDownUp size={16} />
        </button>
      </div>

      {/* OUTPUT TOKEN */}
      <div className="bg-gray-100 p-3 rounded-lg mt-3">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Ke (Estimasi)</span>
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span className="text-xs">Estimates — slippage will affect final amount</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1 gap-3">
          <input
            value={amountOut}
            type="text"
            placeholder="0.0"
            disabled
            className="text-2xl bg-transparent w-full focus:outline-none"
          />
          <button onClick={() => openTokenModal('out')} className="flex items-center font-bold bg-white p-2 rounded-lg shadow-sm hover:bg-gray-50">
            <Image src={tokenOut.logoURI} alt={tokenOut.symbol} width={24} height={24} className="mr-2 rounded-full" />
            <span className="mr-2">{tokenOut.symbol}</span>
            <span className="text-xs">▼</span>
          </button>
        </div>

        {/* Slippage controls */}
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            {SLIPPAGE_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setSelectedSlippage(p); setIsCustomSlippage(false); }}
                className={`px-3 py-1 rounded-md border ${!isCustomSlippage && selectedSlippage === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                aria-pressed={!isCustomSlippage && selectedSlippage === p}
              >
                {p}%
              </button>
            ))}
            <button
              onClick={() => { setIsCustomSlippage(true); setSelectedSlippage(Number(customSlippageValue || 0)); }}
              className={`px-3 py-1 rounded-md border ${isCustomSlippage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Custom
            </button>
            {isCustomSlippage && (
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="50"
                step="0.1"
                value={customSlippageValue}
                onChange={(e) => setCustomSlippageValue(e.target.value)}
                className="ml-2 p-1 w-20 border rounded"
              />
            )}
          </div>

          {/* Min received estimate */}
          {amountOut && (
            <div className="text-xs text-gray-600">
              Min diterima (perkiraan): <span className="font-semibold">{minReceivedEstimate || '-'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tombol Aksi Utama */}
      <div className="mt-4">
        <Button
          onClick={handleActionClick}
          disabled={actionDisabled}
          className="w-full h-12 text-lg"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Memproses...
            </span>
          ) : needsApproval ? (
            `Approve ${tokenIn.symbol}`
          ) : (
            'Swap'
          )}
        </Button>
      </div>

      {/* debug: tunjukkan routerAddress kalau diberikan (bisa dihapus nanti) */}
      {routerAddress && (
        <div className="mt-3 text-xs text-gray-500">
          Router: <code>{String(routerAddress)}</code>
        </div>
      )}

      {/* Modal Token */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pilih Token">
        <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
          {TOKEN_LIST.map((token) => (
            <button
              key={token.address}
              onClick={() => handleSelectToken(token)}
              className="w-full flex items-center p-3 hover:bg-gray-100 rounded-lg text-left"
            >
              <Image src={token.logoURI} alt={token.symbol} width={32} height={32} className="mr-3 rounded-full" />
              <div>
                <p className="font-bold">{token.symbol}</p>
                <p className="text-sm text-gray-500">{token.name}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
