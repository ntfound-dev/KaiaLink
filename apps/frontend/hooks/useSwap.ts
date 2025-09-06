'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, maxUint256 } from 'viem';
// import { ROUTER_ABI, TOKEN_ABI } from '@/lib/constants'; // Ganti dengan ABI & alamat asli

// Placeholder - Ganti dengan ABI dan Alamat Asli Anda
const ROUTER_ABI = [/* ... ABI kontrak Router Uniswap V2 ... */];
const ROUTER_ADDRESS = '0x...';
const TOKEN_ABI = [/* ... ABI token ERC20 ... */];

interface Token {
    address: `0x${string}`;
    symbol: string;
}

export const useSwap = (tokenIn: Token, tokenOut: Token, amountIn: string) => {
  const { address } = useAccount();
  const [amountOut, setAmountOut] = useState('');

  // --- Membaca Data dari Blockchain ---
  const { data, isLoading: isLoadingData, refetch } = useReadContracts({
    contracts: [
      { address: tokenIn.address, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address] },
      { address: tokenIn.address, abi: TOKEN_ABI, functionName: 'allowance', args: [address, ROUTER_ADDRESS] },
      {
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [parseEther(amountIn || '0'), [tokenIn.address, tokenOut.address]],
      },
    ],
    // Hanya jalankan query jika amountIn valid
    queryKey: [tokenIn.address, tokenOut.address, amountIn], // Kunci query agar otomatis refresh
  });

  const [balanceIn, allowanceIn, amountsOutData] = data || [];

  useEffect(() => {
    if (amountsOutData?.result) {
      const amountOutValue = (amountsOutData.result as bigint[])[1];
      setAmountOut(formatEther(amountOutValue));
    } else {
      setAmountOut('');
    }
  }, [amountsOutData]);

  // --- Menulis Transaksi ke Blockchain ---
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash, onSuccess: () => refetch() });
  const isLoading = isPending || isConfirming;

  const approve = () => {
    writeContract({ address: tokenIn.address, abi: TOKEN_ABI, functionName: 'approve', args: [ROUTER_ADDRESS, maxUint256] });
  };

  const swap = () => {
    writeContract({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        parseEther(amountIn),
        0, // amountOutMin (untuk slippage)
        [tokenIn.address, tokenOut.address], // Path
        address,
        Math.floor(Date.now() / 1000) + 60 * 10 // Deadline
      ],
    });
  };
  
  const needsApproval = (allowanceIn?.result as bigint | undefined || 0n) < parseEther(amountIn || '0');

  return {
    balanceIn: balanceIn?.result ? parseFloat(formatEther(balanceIn.result)) : 0,
    amountOut,
    needsApproval,
    approve,
    swap,
    isLoading,
    isLoadingData,
  };
};