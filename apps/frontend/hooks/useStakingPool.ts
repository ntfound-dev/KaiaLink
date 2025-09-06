'use client';

import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, maxUint256 } from 'viem';
// import { STAKING_ABI, STAKING_ADDRESS, TOKEN_ABI } from '@/lib/constants';

// Placeholder - Ganti dengan ABI dan Alamat Asli Anda
const STAKING_ABI = [/* ... ABI kontrak MasterChef/Staking ... */];
const STAKING_ADDRESS = '0x...';
const TOKEN_ABI = [/* ... ABI token ERC20 (untuk LP Token) ... */];

export const useStakingPool = (poolId: number, lpTokenAddress: `0x${string}`) => {
  const { address } = useAccount();

  const { data, isLoading: isLoadingData, refetch } = useReadContracts({
    contracts: [
      { address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'userInfo', args: [poolId, address] },
      { address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'pendingRewards', args: [poolId, address] },
      { address: lpTokenAddress, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address] },
      { address: lpTokenAddress, abi: TOKEN_ABI, functionName: 'allowance', args: [address, STAKING_ADDRESS] },
    ]
  });

  const [userInfo, pendingRewards, lpBalance, allowance] = data || [];
  const stakedBalanceBI = (userInfo?.result as any)?.[0] || 0n;
  
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash, onSuccess: () => refetch() });
  const isLoading = isPending || isConfirming;

  const approve = () => {
    writeContract({ address: lpTokenAddress, abi: TOKEN_ABI, functionName: 'approve', args: [STAKING_ADDRESS, maxUint256] });
  };

  const stake = (amount: string) => {
    writeContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'deposit', args: [poolId, parseEther(amount)] });
  };
  
  const unstake = (amount: string) => {
    writeContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'withdraw', args: [poolId, parseEther(amount)] });
  };

  const harvest = () => {
    writeContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'deposit', args: [poolId, 0n] });
  };
  
  return {
    stakedBalance: parseFloat(formatEther(stakedBalanceBI)),
    rewards: pendingRewards?.result ? parseFloat(formatEther(pendingRewards.result)) : 0,
    lpBalance: lpBalance?.result ? parseFloat(formatEther(lpBalance.result)) : 0,
    allowance: allowance?.result ? parseFloat(formatEther(allowance.result)) : 0,
    approve,
    stake,
    unstake,
    harvest,
    isLoading,
    isLoadingData,
  };
};