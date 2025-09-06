'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
// import { useSwap } from '@/hooks/useSwap';

export function SwapForm() {
  const [amountIn, setAmountIn] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Placeholder data - nantinya akan diganti dengan hook useSwap
  const isLoading = false;
  const needsApproval = true;
  const userBalance = 1250;
  const amountOut = '1225.00'; // Estimasi
  const tokenIn = { symbol: 'USDT' };
  const tokenOut = { symbol: 'LINKA' };

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto relative bg-white shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-lg">Swap</h2>
        <button className="text-xl text-gray-500">⚙️</button>
      </div>

      {/* INPUT TOKEN */}
      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Dari</span>
          <span>Saldo: {userBalance.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <input 
            value={amountIn} 
            onChange={(e) => setAmountIn(e.target.value)} 
            type="number" 
            placeholder="0.0" 
            className="text-2xl bg-transparent w-full focus:outline-none"
          />
          <button onClick={() => setIsModalOpen(true)} className="flex items-center font-bold bg-white p-2 rounded-lg shadow-sm">
            {tokenIn.symbol} <span className="ml-2">▼</span>
          </button>
        </div>
      </div>
      
      {/* Tombol pembalik */}
      <div className="flex justify-center my-[-10px] relative z-10">
        <button className="text-2xl bg-gray-200 p-1 rounded-full border-4 border-white">↓</button>
      </div>
      
      {/* OUTPUT TOKEN */}
      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Ke (Estimasi)</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <input 
            value={amountOut} 
            type="number" 
            placeholder="0.0" 
            disabled 
            className="text-2xl bg-transparent w-full focus:outline-none"
          />
          <button onClick={() => setIsModalOpen(true)} className="flex items-center font-bold bg-white p-2 rounded-lg shadow-sm">
            {tokenOut.symbol} <span className="ml-2">▼</span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        {needsApproval ? (
          <Button isLoading={isLoading} className="w-full">Approve {tokenIn.symbol}</Button>
        ) : (
          <Button isLoading={isLoading} className="w-full">Swap</Button>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pilih Token">
        <p>Daftar token akan muncul di sini...</p>
      </Modal>
    </div>
  );
}

