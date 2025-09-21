// apps/frontend/hooks/useLendingMarket.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers, MaxUint256 } from 'ethers';
import api from '@/lib/api'; // fallback: if backend exposes lending endpoints
import styles from '@/styles/lending.module.css';

type BigLike = bigint | number | string;

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

// v6 constant (bigint) — MaxUint256 is a bigint coming from ethers
const MAX_UINT = MaxUint256;

/** Coerce various numeric shapes into bigint without using bigint literals */
function toBig(v?: any): bigint {
  if (v === undefined || v === null) return BigInt(0);
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(Math.trunc(v));
  if (typeof v === 'string') {
    // try parse as integer string, fallback to Number then BigInt
    try {
      // BigInt('0') works; BigInt('123.4') throws — try Number fallback
      return BigInt(v);
    } catch {
      const n = Number(v);
      if (Number.isFinite(n)) return BigInt(Math.trunc(n));
      return BigInt(0);
    }
  }
  // fallback
  try {
    return BigInt(v);
  } catch {
    return BigInt(0);
  }
}

/**
 * useLendingMarket
 * @param asset - token address OR symbol (prefer address)
 * @param opts - optional config: { tokenAddress?: string, marketAddress?: string, providerOverride? }
 */
export function useLendingMarket(
  asset: { tokenAddress?: string; marketAddress?: string } | string,
  opts?: { providerOverride?: any }
) {
  const tokenAddr = typeof asset === 'string' ? asset : asset?.tokenAddress ?? '';
  const marketAddr = typeof asset === 'string' ? undefined : asset?.marketAddress;

  // provider from injected wallet (MetaMask) — v6 uses BrowserProvider
  const provider = useMemo(() => {
    if (opts?.providerOverride) return opts?.providerOverride;
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        return new ethers.BrowserProvider((window as any).ethereum as any);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [opts?.providerOverride]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userSuppliedBalance, setUserSuppliedBalance] = useState<BigLike>(BigInt(0));
  const [userBorrowedBalance, setUserBorrowedBalance] = useState<BigLike>(BigInt(0));
  const [allowance, setAllowance] = useState<BigLike>(BigInt(0));
  const [error, setError] = useState<string | null>(null);

  const getAddress = useCallback(async () => {
    try {
      if (!provider) return undefined;
      // provider.getSigner() is async in v6
      const signer = await provider.getSigner();
      return await signer.getAddress();
    } catch {
      return undefined;
    }
  }, [provider]);

  async function readBalance(addr: string): Promise<bigint> {
    if (!provider || !addr) return BigInt(0);
    const contract = new ethers.Contract(addr, ERC20_ABI, provider as any);
    const owner = await getAddress();
    if (!owner) return BigInt(0);
    const res = await contract.balanceOf(owner);
    return toBig(res);
  }

  async function readAllowance(tokenAddr: string, spender?: string): Promise<bigint> {
    if (!provider || !tokenAddr) return BigInt(0);
    const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider as any);
    const owner = await getAddress();
    const s = spender ?? marketAddr ?? (await getAddress()); // fallback
    if (!owner || !s) return BigInt(0);
    const res = await contract.allowance(owner, s);
    return toBig(res);
  }

  useEffect(() => {
    let mounted = true;
    setIsLoadingData(true);
    setError(null);

    (async () => {
      try {
        // If backend exposes lending summary, prefer that
        if (api && typeof (api as any).getLendingMarketSummary === 'function' && typeof tokenAddr === 'string' && tokenAddr) {
          try {
            const summary = await (api as any).getLendingMarketSummary(tokenAddr);
            if (!mounted) return;
            setUserSuppliedBalance(toBig(summary?.supplied ?? 0));
            setUserBorrowedBalance(toBig(summary?.borrowed ?? 0));
            setAllowance(toBig(summary?.allowance ?? 0));
            setIsLoadingData(false);
            return;
          } catch {
            // fallback to on-chain reads below
          }
        }

        // on-chain reads
        if (!tokenAddr || !provider) {
          if (mounted) {
            setUserSuppliedBalance(BigInt(0));
            setUserBorrowedBalance(BigInt(0));
            setAllowance(BigInt(0));
            setIsLoadingData(false);
          }
          return;
        }

        const [bal, al] = await Promise.all([readBalance(tokenAddr), readAllowance(tokenAddr)]);
        // userBorrowedBalance retrieval differs per protocol; try backend if available
        let borrowed: bigint = BigInt(0);
        if (api && typeof (api as any).getUserBorrowedAmount === 'function') {
          try {
            borrowed = toBig(await (api as any).getUserBorrowedAmount(tokenAddr));
          } catch {
            borrowed = BigInt(0);
          }
        }

        if (!mounted) return;
        setUserSuppliedBalance(bal);
        setAllowance(al);
        setUserBorrowedBalance(borrowed);
      } catch (err: any) {
        console.error('useLendingMarket read error', err);
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
            const [bal, al] = await Promise.all([readBalance(tokenAddr), readAllowance(tokenAddr)]);
            setUserSuppliedBalance(bal);
            setAllowance(al);
            // borrowed refresh via backend if possible
            if (api && typeof (api as any).getUserBorrowedAmount === 'function') {
              try {
                const borrowed = await (api as any).getUserBorrowedAmount(tokenAddr);
                setUserBorrowedBalance(toBig(borrowed));
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
  }, [provider, tokenAddr, marketAddr, getAddress]);

  const approve = useCallback(
    async (spender: string, amount?: bigint | string | number) => {
      setError(null);
      if (!provider) throw new Error('Wallet provider not available');
      if (!tokenAddr) throw new Error('Token address required for approve');
      setIsLoading(true);
      try {
        // get signer (v6 BrowserProvider.getSigner() is async)
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(tokenAddr, ERC20_ABI, signer as any);
        const tx = await contract.approve(spender, (amount ?? MAX_UINT) as any);
        await tx.wait?.(1); // some providers return a transaction response with wait
        // refresh allowance
        const owner = await signer.getAddress();
        const newAllowance = await new ethers.Contract(tokenAddr, ERC20_ABI, provider as any).allowance(owner, spender);
        setAllowance(toBig(newAllowance));
        setIsLoading(false);
        return tx;
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [provider, tokenAddr]
  );

  /**
   * supply/withdraw/borrow/repay
   * Prefer backend endpoint (api.supplyToMarket / api.borrowFromMarket) if available,
   * otherwise throw instructive error (on-chain lending integration is protocol-specific).
   */
  const supply = useCallback(
    async (amount: string) => {
      setError(null);
      setIsLoading(true);
      try {
        // backend relay (preferred)
        if (api && typeof (api as any).supplyToMarket === 'function') {
          const res = await (api as any).supplyToMarket({ token: tokenAddr, amount, market: marketAddr });
          setIsLoading(false);
          // refresh balances via side-effect or rely on caller to re-fetch
          return res;
        }
        throw new Error('Backend supply endpoint not found. Implement api.supplyToMarket or integrate protocol on-chain logic here.');
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [tokenAddr, marketAddr]
  );

  const withdraw = useCallback(
    async (amount: string) => {
      setError(null);
      setIsLoading(true);
      try {
        if (api && typeof (api as any).withdrawFromMarket === 'function') {
          const res = await (api as any).withdrawFromMarket({ token: tokenAddr, amount, market: marketAddr });
          setIsLoading(false);
          return res;
        }
        throw new Error('Backend withdraw endpoint not found. Implement api.withdrawFromMarket or integrate protocol on-chain logic here.');
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [tokenAddr, marketAddr]
  );

  const borrow = useCallback(
    async (amount: string) => {
      setError(null);
      setIsLoading(true);
      try {
        if (api && typeof (api as any).borrowFromMarket === 'function') {
          const res = await (api as any).borrowFromMarket({ token: tokenAddr, amount, market: marketAddr });
          setIsLoading(false);
          return res;
        }
        throw new Error('Backend borrow endpoint not found. Implement api.borrowFromMarket or integrate protocol on-chain logic here.');
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [tokenAddr, marketAddr]
  );

  const repay = useCallback(
    async (amount: string) => {
      setError(null);
      setIsLoading(true);
      try {
        if (api && typeof (api as any).repayToMarket === 'function') {
          const res = await (api as any).repayToMarket({ token: tokenAddr, amount, market: marketAddr });
          setIsLoading(false);
          return res;
        }
        throw new Error('Backend repay endpoint not found. Implement api.repayToMarket or integrate protocol on-chain logic here.');
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [tokenAddr, marketAddr]
  );

  return {
    userSuppliedBalance,
    userBorrowedBalance,
    allowance,
    approve,
    supply,
    withdraw,
    borrow,
    repay,
    isLoading,
    isLoadingData,
    error,
  };
}
