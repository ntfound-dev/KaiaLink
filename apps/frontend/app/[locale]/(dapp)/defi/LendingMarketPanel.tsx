// apps/frontend/components/defi/LendingMarketPanel.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useLendingMarket } from '@/hooks/useLendingMarket';

interface LendingMarketPanelProps {
  market: {
    asset: string;
    supplyApy: number;
    borrowApy: number;
  };
}

export function LendingMarketPanel({ market }: LendingMarketPanelProps) {
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  
  const {
    userSuppliedBalance,
    userBorrowedBalance,
    allowance,
    approve,
    supply,
    withdraw,
    isLoading,
    isLoadingData,
  } = useLendingMarket(market.asset);

  const needsApproval = allowance < parseFloat(supplyAmount || '0');

  const handleSupply = () => {
    if (needsApproval) {
      approve(supplyAmount);
    } else {
      supply(supplyAmount);
    }
  };

  if (isLoadingData) {
    return <div className="p-4 border rounded-lg text-center">Memuat data market...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-3">{market.asset} Market</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KOLOM SUPPLY */}
        <div className="p-3 bg-green-50 rounded-md">
          <h4 className="font-semibold mb-2">Deposit (Supply)</h4>
          <p className="text-sm">APY: <span className="font-bold text-green-600">{market.supplyApy}%</span></p>
          <p className="text-sm">Saldo Deposit Anda: ${userSuppliedBalance.toFixed(2)}</p>
          <div className="mt-3 space-y-2">
            <input 
              type="number" 
              placeholder={`0.0 ${market.asset}`} 
              className="w-full p-2 border rounded"
              value={supplyAmount}
              onChange={(e) => setSupplyAmount(e.target.value)}
            />
            <Button size="sm" className="w-full" onClick={handleSupply} isLoading={isLoading}>
              {needsApproval ? `Approve ${market.asset}` : 'Supply'}
            </Button>
            <Button size="sm" variant="secondary" className="w-full" onClick={() => withdraw(supplyAmount)} isLoading={isLoading}>
              Withdraw
            </Button>
          </div>
        </div>

        {/* KOLOM BORROW */}
        <div className="p-3 bg-red-50 rounded-md">
          <h4 className="font-semibold mb-2">Pinjam (Borrow)</h4>
          <p className="text-sm">APY: <span className="font-bold text-red-600">{market.borrowApy}%</span></p>
          <p className="text-sm">Pinjaman Anda: ${userBorrowedBalance.toFixed(2)}</p>
          <div className="mt-3 space-y-2">
            <input 
              type="number" 
              placeholder={`0.0 ${market.asset}`} 
              className="w-full p-2 border rounded"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
            />
            <Button size="sm" className="w-full" isLoading={isLoading}>Borrow</Button>
            <Button size="sm" variant="secondary" className="w-full" isLoading={isLoading}>Repay</Button>
          </div>
        </div>
      </div>
      <div className="mt-4 text-center text-sm">
        {/* Data health factor akan datang dari hook juga */}
        <p>Health Factor: <span className="font-bold">1.8</span> (Jaga di atas 1.0)</p>
      </div>
    </div>
  );
}