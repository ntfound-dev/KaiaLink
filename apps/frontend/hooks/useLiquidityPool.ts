'use client';

import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, maxUint256 } from 'viem';
// import { ROUTER_ABI, ROUTER_ADDRESS, TOKEN_ABI } from '@/lib/constants';

// Placeholder - Ganti dengan ABI dan Alamat Asli Anda
const ROUTER_ABI = [/* ... ABI kontrak Router Uniswap V2 ... */];
const ROUTER_ADDRESS = '0x...';
const TOKEN_ABI = [/* ... ABI token ERC20 ... */];

export const useLiquidityPool = (tokenA_Address: `0x${string}`, tokenB_Address: `0x${string}`, pairAddress: `0x${string}`) => {
  const { address } = useAccount();

  const { data, isLoading: isLoadingData, refetch } = useReadContracts({
    contracts: [
      { address: tokenA_Address, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address] },
      { address: tokenB_Address, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address] },
      { address: pairAddress, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address] },
      { address: tokenA_Address, abi: TOKEN_ABI, functionName: 'allowance', args: [address, ROUTER_ADDRESS] },
      { address: tokenB_Address, abi: TOKEN_ABI, functionName: 'allowance', args: [address, ROUTER_ADDRESS] },
    ]
  });

  const [balanceA, balanceB, lpBalance, allowanceA, allowanceB] = data || [];

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash, onSuccess: () => refetch() });
  const isLoading = isPending || isConfirming;

  const approve = (tokenAddress: `0x${string}`) => {
    writeContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: 'approve', args: [ROUTER_ADDRESS, maxUint256] });
  };

  const addLiquidity = (amountA: string, amountB: string) => {
    writeContract({
      address: ROUTER_ADDRESS, abi: ROUTER_ABI, functionName: 'addLiquidity',
      args: [ tokenA_Address, tokenB_Address, parseEther(amountA), parseEther(amountB), 0, 0, address, Math.floor(Date.now() / 1000) + 60 * 10 ],
    });
  };
  
  // ... fungsi untuk removeLiquidity bisa ditambahkan di sini

  return {
    balanceA: balanceA?.result ? parseFloat(formatEther(balanceA.result)) : 0,
    balanceB: balanceB?.result ? parseFloat(formatEther(balanceB.result)) : 0,
    lpBalance: lpBalance?.result ? parseFloat(formatEther(lpBalance.result)) : 0,
    allowanceA: allowanceA?.result ? parseFloat(formatEther(allowanceA.result)) : 0,
    allowanceB: allowanceB?.result ? parseFloat(formatEther(allowanceB.result)) : 0,
    approve,
    addLiquidity,
    isLoading,
    isLoadingData,
  };
};