// apps/frontend/hooks/useStakingPool.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers, MaxUint256 } from 'ethers';
import api from '@/lib/api';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

const MAX_UINT = MaxUint256;

type BigLike = bigint | number | string;

/** safe coercer to bigint without bigint literal syntax */
function toBig(v?: any): bigint {
  if (v === undefined || v === null) return BigInt(0);
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(Math.trunc(v));
  if (typeof v === 'string') {
    try {
      return BigInt(v);
    } catch {
      const n = Number(v);
      if (Number.isFinite(n)) return BigInt(Math.trunc(n));
      return BigInt(0);
    }
  }
  try {
    return BigInt(v);
  } catch {
    return BigInt(0);
  }
}

/** convert BigLike -> number (best-effort, may lose precision for very large values) */
function bigToNumber(v: BigLike): number {
  try {
    if (typeof v === 'bigint') return Number(v);
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * useStakingPool
 * - tokenAddress: LP token address (hex string) — used to read token balance as placeholder
 * - poolId: optional identifier for backend
 */
export function useStakingPool(tokenAddress?: string, poolId?: number | string) {
  const [stakedBalance, setStakedBalance] = useState<BigLike>(BigInt(0));
  const [rewards, setRewards] = useState<BigLike>(BigInt(0));
  const [allowance, setAllowance] = useState<BigLike>(BigInt(0));
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // provider (BrowserProvider) from injected wallets
  const provider = useMemo(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        return new ethers.BrowserProvider((window as any).ethereum as any);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, []);

  // helper to get signer when needed (BrowserProvider.getSigner() is async)
  const getSigner = useCallback(async () => {
    if (!provider) return undefined;
    try {
      return await provider.getSigner();
    } catch {
      return undefined;
    }
  }, [provider]);

  const getAddress = useCallback(async () => {
    try {
      const signer = await getSigner();
      if (!signer) return undefined;
      return await signer.getAddress();
    } catch {
      return undefined;
    }
  }, [getSigner]);

  // helper reads (return bigint)
  async function readBalanceOf(tokenAddr?: string): Promise<bigint> {
    if (!provider || !tokenAddr) return BigInt(0);
    try {
      const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider as any);
      const owner = await getAddress();
      if (!owner) return BigInt(0);
      const res = await contract.balanceOf(owner);
      return toBig(res);
    } catch {
      return BigInt(0);
    }
  }

  async function readAllowance(tokenAddr?: string, spender?: string): Promise<bigint> {
    if (!provider || !tokenAddr || !spender) return BigInt(0);
    try {
      const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider as any);
      const owner = await getAddress();
      if (!owner) return BigInt(0);
      const res = await contract.allowance(owner, spender);
      return toBig(res);
    } catch {
      return BigInt(0);
    }
  }

  // initial fetch
  useEffect(() => {
    let mounted = true;
    setIsLoadingData(true);
    setError(null);

    (async () => {
      try {
        // Preferred: get summary from backend if available
        if (api && typeof (api as any).getStakingSummary === 'function' && tokenAddress) {
          try {
            const summary = await (api as any).getStakingSummary(tokenAddress, poolId);
            if (!mounted) return;
            setStakedBalance(toBig(summary?.staked ?? summary?.balance ?? 0));
            setRewards(toBig(summary?.rewards ?? 0));
            setAllowance(toBig(summary?.allowance ?? 0));
            setIsLoadingData(false);
            return;
          } catch {
            // fallback to on-chain below
          }
        }

        // on-chain fallback: read token balance as placeholder and allowance = 0
        if (!tokenAddress || !provider) {
          if (mounted) {
            setStakedBalance(BigInt(0));
            setRewards(BigInt(0));
            setAllowance(BigInt(0));
            setIsLoadingData(false);
          }
          return;
        }

        const [lpBal] = await Promise.all([readBalanceOf(tokenAddress)]);
        if (!mounted) return;
        setStakedBalance(lpBal);
        setAllowance(BigInt(0));
      } catch (err: any) {
        console.error('useStakingPool error', err);
        if (mounted) setError(String(err?.message ?? err));
      } finally {
        if (mounted) setIsLoadingData(false);
      }
    })();

    const handleAccountsChanged = () => {
      setTimeout(() => {
        void (async () => {
          setIsLoadingData(true);
          try {
            const [lpBal] = await Promise.all([readBalanceOf(tokenAddress)]);
            setStakedBalance(lpBal);
            if (api && typeof (api as any).getStakingSummary === 'function') {
              try {
                const summary = await (api as any).getStakingSummary(tokenAddress, poolId);
                setRewards(toBig(summary?.rewards ?? 0));
                setAllowance(toBig(summary?.allowance ?? 0));
              } catch {}
            }
          } catch (e) {
            console.error(e);
          } finally {
            setIsLoadingData(false);
          }
        })();
      }, 200);
    };

    try {
      (window as any).ethereum?.on?.('accountsChanged', handleAccountsChanged);
      (window as any).ethereum?.on?.('chainChanged', handleAccountsChanged);
    } catch {}

    return () => {
      mounted = false;
      try {
        (window as any).ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
        (window as any).ethereum?.removeListener?.('chainChanged', handleAccountsChanged);
      } catch {}
    };
  }, [provider, tokenAddress, poolId, getAddress]);

  // approve (uses signer)
  const approve = useCallback(
    async (spender: string) => {
      setError(null);
      const signer = await getSigner();
      if (!signer) throw new Error('Wallet tidak terhubung');
      if (!tokenAddress) throw new Error('Token address diperlukan');
      setIsLoading(true);
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer as any);
        const tx = await contract.approve(spender, MAX_UINT as any);
        await tx.wait?.(1);

        // refresh allowance either from backend or on-chain
        if (api && typeof (api as any).getStakingSummary === 'function') {
          try {
            const summary = await (api as any).getStakingSummary(tokenAddress, poolId);
            setAllowance(toBig(summary?.allowance ?? 0));
          } catch {
            const owner = await signer.getAddress();
            const newAl = await new ethers.Contract(tokenAddress, ERC20_ABI, provider as any).allowance(owner, spender);
            setAllowance(toBig(newAl));
          }
        } else {
          const owner = await signer.getAddress();
          const newAl = await new ethers.Contract(tokenAddress, ERC20_ABI, provider as any).allowance(owner, spender);
          setAllowance(toBig(newAl));
        }

        setIsLoading(false);
        return tx;
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [getSigner, tokenAddress, poolId, provider]
  );

  // stake/unstake/harvest — prefer backend endpoints
  const stake = useCallback(
    async (amount: string) => {
      setError(null);
      setIsLoading(true);
      try {
        if (api && typeof (api as any).stakeToPool === 'function') {
          const res = await (api as any).stakeToPool({ poolId, token: tokenAddress, amount });
          if (typeof (api as any).getStakingSummary === 'function') {
            const summary = await (api as any).getStakingSummary(tokenAddress, poolId);
            setStakedBalance(toBig(summary?.staked ?? summary?.balance ?? 0));
            setRewards(toBig(summary?.rewards ?? 0));
          }
          setIsLoading(false);
          return res;
        }
        throw new Error('Backend stake endpoint tidak ditemukan. Implement api.stakeToPool atau on-chain logic.');
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [poolId, tokenAddress]
  );

  const unstake = useCallback(
    async (amount: string) => {
      setError(null);
      setIsLoading(true);
      try {
        if (api && typeof (api as any).unstakeFromPool === 'function') {
          const res = await (api as any).unstakeFromPool({ poolId, token: tokenAddress, amount });
          if (typeof (api as any).getStakingSummary === 'function') {
            const summary = await (api as any).getStakingSummary(tokenAddress, poolId);
            setStakedBalance(toBig(summary?.staked ?? 0));
            setRewards(toBig(summary?.rewards ?? 0));
          }
          setIsLoading(false);
          return res;
        }
        throw new Error('Backend unstake endpoint tidak ditemukan.');
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [poolId, tokenAddress]
  );

  const harvest = useCallback(
    async () => {
      setError(null);
      setIsLoading(true);
      try {
        if (api && typeof (api as any).harvestFromPool === 'function') {
          const res = await (api as any).harvestFromPool({ poolId, token: tokenAddress });
          if (typeof (api as any).getStakingSummary === 'function') {
            const summary = await (api as any).getStakingSummary(tokenAddress, poolId);
            setRewards(toBig(summary?.rewards ?? 0));
          }
          setIsLoading(false);
          return res;
        }
        throw new Error('Backend harvest endpoint tidak ditemukan.');
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [poolId, tokenAddress]
  );

  // numeric helper views
  const stakedAsNumber = useMemo(() => bigToNumber(stakedBalance), [stakedBalance]);
  const rewardsAsNumber = useMemo(() => bigToNumber(rewards), [rewards]);
  const allowanceAsNumber = useMemo(() => bigToNumber(allowance), [allowance]);

  const needsApproval = (requestedAmount: number) => allowanceAsNumber < requestedAmount;

  return {
    stakedBalance,
    rewards,
    stakedAsNumber,
    rewardsAsNumber,
    allowanceAsNumber,
    needsApproval,
    approve,
    stake,
    unstake,
    harvest,
    isLoadingData,
    isLoading,
    error,
  };
}
