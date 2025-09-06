'use client';

import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, maxUint256 } from 'viem';
// import { CTOKEN_ABI, TOKEN_ABI } from '@/lib/constants';

// Placeholder - Ganti dengan ABI dan Alamat Asli Anda
const CTOKEN_ABI = [/* ... ABI kontrak cToken (market) ... */];
const TOKEN_ABI = [/* ... ABI token ERC20 ... */];

export const useLendingMarket = (tokenAddress: `0x${string}`, marketAddress: `0x${string}`) => {
  const { address } = useAccount();

  const { data, isLoading: isLoadingData, refetch } = useReadContracts({
    contracts: [
      { address: marketAddress, abi: CTOKEN_ABI, functionName: 'balanceOf', args: [address] },
      { address: marketAddress, abi: CTOKEN_ABI, functionName: 'borrowBalanceStored', args: [address] },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address] },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'allowance', args: [address, marketAddress] },
    ]
  });

  const [cTokenBalance, borrowBalance, walletBalance, allowance] = data || [];

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash, onSuccess: () => refetch() });
  const isLoading = isPending || isConfirming;

  const approve = () => {
    writeContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: 'approve', args: [marketAddress, maxUint256] });
  };

  const supply = (amount: string) => {
    writeContract({ address: marketAddress, abi: CTOKEN_ABI, functionName: 'mint', args: [parseEther(amount)] });
  };
  
  const withdraw = (cTokenAmount: string) => {
    writeContract({ address: marketAddress, abi: CTOKEN_ABI, functionName: 'redeem', args: [parseEther(cTokenAmount)] });
  };
  
  // ... fungsi borrow dan repay

  return {
    userSuppliedBalance: cTokenBalance?.result ? parseFloat(formatEther(cTokenBalance.result)) : 0,
    userBorrowedBalance: borrowBalance?.result ? parseFloat(formatEther(borrowBalance.result)) : 0,
    userTokenBalance: walletBalance?.result ? parseFloat(formatEther(walletBalance.result)) : 0,
    allowance: allowance?.result ? parseFloat(formatEther(allowance.result)) : 0,
    approve,
    supply,
    withdraw,
    isLoading,
    isLoadingData,
  };
};