'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useLiquidityPool } from '@/hooks/useLiquidityPool';

interface TokenInfo {
  symbol: string;
  address: `0x${string}`;
}

interface LiquidityPanelProps {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  pairAddress: `0x${string}`;
}

export function LiquidityPanel({ tokenA, tokenB, pairAddress }: LiquidityPanelProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  const {
    balanceA,
    balanceB,
    allowanceA,
    allowanceB,
    approve,
    addLiquidity,
    isLoading,
    isLoadingData
  } = useLiquidityPool(tokenA.address, tokenB.address, pairAddress);

  // Cek apakah pengguna perlu approve salah satu token
  const needsApprovalA = allowanceA < parseFloat(amountA || '0');
  const needsApprovalB = allowanceB < parseFloat(amountB || '0');
  
  const handleAddLiquidity = () => {
    if (needsApprovalA) {
      approve(tokenA.address);
      return;
    }
    if (needsApprovalB) {
      approve(tokenB.address);
      return;
    }
    addLiquidity(amountA, amountB);
  };
  
  if (isLoadingData) return <div className="p-4 border rounded-lg text-center">Memuat data pool...</div>

  return (
    <div className="p-4 border rounded-xl bg-white shadow-lg">
      <h3 className="text-xl font-bold mb-3">Pool: {tokenA.symbol}/{tokenB.symbol}</h3>
      
      <div className="flex border-b mb-4">
        <button onClick={() => setActiveTab('add')} className={`px-4 py-2 font-semibold ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Tambah Likuiditas</button>
        <button onClick={() => setActiveTab('remove')} className={`px-4 py-2 font-semibold ${activeTab === 'remove' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Tarik Likuiditas</button>
      </div>
      
      {activeTab === 'add' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Sediakan kedua token untuk mendapatkan imbalan fee.</p>
          
          <div className="bg-gray-50 p-2 rounded-lg border">
            <div className="flex justify-between text-xs text-gray-500">
                <span>{tokenA.symbol}</span> 
                <span>Saldo: {balanceA.toFixed(4)}</span>
            </div>
            <input type="number" value={amountA} onChange={(e) => setAmountA(e.target.value)} placeholder="0.0" className="w-full text-xl bg-transparent focus:outline-none"/>
          </div>
          
          <div className="bg-gray-50 p-2 rounded-lg border">
            <div className="flex justify-between text-xs text-gray-500">
                <span>{tokenB.symbol}</span> 
                <span>Saldo: {balanceB.toFixed(4)}</span>
            </div>
            <input type="number" value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="0.0" className="w-full text-xl bg-transparent focus:outline-none"/>
          </div>
          
          <Button onClick={handleAddLiquidity} isLoading={isLoading} className="w-full !mt-4 h-11 text-base">
            {needsApprovalA ? `Approve ${tokenA.symbol}` : needsApprovalB ? `Approve ${tokenB.symbol}` : 'Sediakan Likuiditas'}
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