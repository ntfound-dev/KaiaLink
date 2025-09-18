// apps/frontend/components/defi/SwapForm.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowDownUp, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useSwap } from '@/hooks/useSwap'; // harap ada; jika signature berbeda, adaptasi hook

// Placeholder token list (ganti dengan daftar token sebenarnya)
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

/**
 * SwapForm menerima optional props (routerAddress, readOptions, oneUnit).
 * Page yang mengimpor bisa tetap mengirim props — ini memperbaiki error TS "IntrinsicAttributes".
 *
 * NOTE: jika hook `useSwap` yang kamu punya menerima `routerAddress`/`readOptions`/`oneUnit`
 * sebagai parameter, ubah pemanggilan useSwap di bawah sesuai signature hook-mu.
 */
export default function SwapForm(props: SwapFormProps): JSX.Element {
  const { routerAddress, readOptions, oneUnit } = props;

  const [amountIn, setAmountIn] = useState('');
  const [tokenIn, setTokenIn] = useState(TOKEN_LIST[0]);
  const [tokenOut, setTokenOut] = useState(TOKEN_LIST[1]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'in' | 'out'>('in');

  // Jika useSwap menerima more args/options, sesuaikan panggilannya di sini.
  // Saat ini kita panggil dengan (tokenIn, tokenOut, amountIn) agar kompatibel
  // dengan kebanyakan implementasi; jika hook-mu menerima options, ubah.
  const {
    balanceIn = 0,
    amountOut = '',
    needsApproval = false,
    approve,
    swap,
    isLoading = false,
  } = useSwap(tokenIn, tokenOut, amountIn);

  const balanceDisplay = useMemo(() => {
    try {
      if (typeof balanceIn === 'number') return balanceIn.toLocaleString();
      if (typeof balanceIn === 'string') return parseFloat(balanceIn).toLocaleString();
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

  const actionDisabled = !amountIn || Number(amountIn) <= 0 || isLoading;

  const handleActionClick = async () => {
    if (needsApproval) {
      if (typeof approve === 'function') await approve();
      return;
    }
    if (typeof swap === 'function') await swap();
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

      {/* debug: tunjukkan routerAddress/oneUnit kalau diberikan (bisa dihapus nanti) */}
      {(routerAddress || oneUnit) && (
        <div className="mt-3 text-xs text-gray-500">
          {routerAddress && <div>Router: <code>{String(routerAddress)}</code></div>}
          {oneUnit && <div>oneUnit: <code>{oneUnit.toString()}</code></div>}
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
