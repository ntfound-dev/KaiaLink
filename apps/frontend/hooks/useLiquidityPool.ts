// apps/frontend/hooks/useLiquidityPool.ts
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { ethers, MaxUint256 } from 'ethers';
import type { DeFiConfig } from '@/types/shared';

/**
 * Minimal ERC-20 ABI pieces we need
 */
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// v6 top-level bigint constant
const MAX_UINT = MaxUint256;

type BigLike = bigint | number | string;

/** Coerce various shapes into bigint without using bigint literal syntax */
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

/**
 * useLiquidityPool
 * - tokenAAddress, tokenBAddress, pairAddress expected hex strings (0x...)
 */
export function useLiquidityPool(tokenAAddress: string, tokenBAddress: string, pairAddress: string) {
  const [balanceA, setBalanceA] = useState<BigLike>(BigInt(0));
  const [balanceB, setBalanceB] = useState<BigLike>(BigInt(0));
  const [allowanceA, setAllowanceA] = useState<BigLike>(BigInt(0));
  const [allowanceB, setAllowanceB] = useState<BigLike>(BigInt(0));
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // provider (BrowserProvider) from injected wallet (MetaMask)
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

  // signer will be fetched async when needed via provider.getSigner()
  const userAddressPromise = useCallback(async () => {
    try {
      if (!provider) return undefined;
      const signer = await provider.getSigner();
      return await signer.getAddress();
    } catch {
      return undefined;
    }
  }, [provider]);

  // helper to read ERC20 uints (returns bigint)
  async function readTokenUint(tokenAddr: string, fn: 'balanceOf' | 'allowance', owner?: string, spender?: string) {
    if (!provider) return BigInt(0);
    const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider as any);
    if (fn === 'balanceOf') {
      const addr = owner ?? (await userAddressPromise());
      if (!addr) return BigInt(0);
      const res = await contract.balanceOf(addr);
      return toBig(res);
    } else {
      const o = owner ?? (await userAddressPromise());
      const s = spender ?? pairAddress;
      if (!o || !s) return BigInt(0);
      const res = await contract.allowance(o, s);
      return toBig(res);
    }
  }

  // Fetch balances & allowances
  useEffect(() => {
    let mounted = true;
    setIsLoadingData(true);
    setError(null);

    (async () => {
      try {
        if (!provider) {
          if (mounted) {
            setBalanceA(BigInt(0));
            setBalanceB(BigInt(0));
            setAllowanceA(BigInt(0));
            setAllowanceB(BigInt(0));
            setIsLoadingData(false);
          }
          return;
        }

        const owner = await userAddressPromise();
        if (!owner) {
          if (mounted) {
            setBalanceA(BigInt(0));
            setBalanceB(BigInt(0));
            setAllowanceA(BigInt(0));
            setAllowanceB(BigInt(0));
            setIsLoadingData(false);
          }
          return;
        }

        const [bA, bB, alA, alB] = await Promise.all([
          readTokenUint(tokenAAddress, 'balanceOf', owner),
          readTokenUint(tokenBAddress, 'balanceOf', owner),
          readTokenUint(tokenAAddress, 'allowance', owner, pairAddress),
          readTokenUint(tokenBAddress, 'allowance', owner, pairAddress),
        ]);

        if (!mounted) return;
        setBalanceA(bA);
        setBalanceB(bB);
        setAllowanceA(alA);
        setAllowanceB(alB);
      } catch (err: any) {
        console.error('useLiquidityPool read error', err);
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
            const owner = await userAddressPromise();
            if (!owner) {
              setBalanceA(BigInt(0));
              setBalanceB(BigInt(0));
              setAllowanceA(BigInt(0));
              setAllowanceB(BigInt(0));
              setIsLoadingData(false);
              return;
            }
            const [bA, bB, alA, alB] = await Promise.all([
              readTokenUint(tokenAAddress, 'balanceOf', owner),
              readTokenUint(tokenBAddress, 'balanceOf', owner),
              readTokenUint(tokenAAddress, 'allowance', owner, pairAddress),
              readTokenUint(tokenBAddress, 'allowance', owner, pairAddress),
            ]);
            setBalanceA(bA);
            setBalanceB(bB);
            setAllowanceA(alA);
            setAllowanceB(alB);
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
    } catch {
      // ignore listener errors
    }

    return () => {
      mounted = false;
      try {
        (window as any).ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
        (window as any).ethereum?.removeListener?.('chainChanged', handleAccountsChanged);
      } catch {
        // ignore
      }
    };
  }, [provider, tokenAAddress, tokenBAddress, pairAddress, userAddressPromise]);

  // approve function (uses signer)
  async function approve(tokenAddr: string) {
    setError(null);
    if (!provider) throw new Error('Wallet provider not available');
    try {
      const signer = await provider.getSigner();
      if (!signer) throw new Error('No signer available (wallet not connected)');
      const contract = new ethers.Contract(tokenAddr, ERC20_ABI, signer as any);
      const tx = await contract.approve(pairAddress, MAX_UINT as any);
      await tx.wait?.(1);
      const owner = await signer.getAddress();
      const newAllowance = await readTokenUint(tokenAddr, 'allowance', owner, pairAddress);
      if (tokenAddr.toLowerCase() === tokenAAddress.toLowerCase()) setAllowanceA(newAllowance);
      if (tokenAddr.toLowerCase() === tokenBAddress.toLowerCase()) setAllowanceB(newAllowance);
      return tx;
    } catch (err: any) {
      console.error('approve error', err);
      throw err;
    }
  }

  // addLiquidity (best-effort)
  const addLiquidity = useCallback(
    async (amountAStr: string, amountBStr: string) => {
      setError(null);
      setIsLoading(true);
      try {
        // parse amounts (assume 18 decimals — ideally query decimals)
        const amtA = ethers.parseUnits(amountAStr || '0', 18);
        const amtB = ethers.parseUnits(amountBStr || '0', 18);

        // Try to get routerAddress from backend typed config (if available)
        let routerAddress: string | undefined;
        try {
          const maybe = await import('@/lib/api/real');
          const typed = (maybe as any).typedApi;
          if (typed?.getDeFiConfig) {
            const conf: DeFiConfig = await typed.getDeFiConfig();
            routerAddress = conf?.routerAddress ?? undefined;
          }
        } catch {
          // ignore import errors
        }

        if (!routerAddress) {
          throw new Error(
            'Router address not found (typedApi.getDeFiConfig.routerAddress). Implement addLiquidity logic for your router or provide routerAddress via backend.'
          );
        }

        if (!provider) throw new Error('Wallet provider not available');
        const signer = await provider.getSigner();
        if (!signer) throw new Error('Wallet not connected (no signer)');

        const ROUTER_ABI = [
          'function addLiquidity(address tokenA,address tokenB,uint amountADesired,uint amountBDesired,uint amountAMin,uint amountBMin,address to,uint deadline) payable returns (uint amountA, uint amountB, uint liquidity)',
        ];
        const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer as any);

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
        const tx = await router.addLiquidity(
          tokenAAddress,
          tokenBAddress,
          amtA,
          amtB,
          0, // amountAMin (you should calculate slippage)
          0, // amountBMin
          await signer.getAddress(),
          deadline
        );
        await tx.wait(1);

        // refresh balances & allowances after tx
        const owner = await signer.getAddress();
        const [bA, bB, alA, alB] = await Promise.all([
          readTokenUint(tokenAAddress, 'balanceOf', owner),
          readTokenUint(tokenBAddress, 'balanceOf', owner),
          readTokenUint(tokenAAddress, 'allowance', owner, pairAddress),
          readTokenUint(tokenBAddress, 'allowance', owner, pairAddress),
        ]);
        setBalanceA(bA);
        setBalanceB(bB);
        setAllowanceA(alA);
        setAllowanceB(alB);

        setIsLoading(false);
        return tx;
      } catch (err: any) {
        setIsLoading(false);
        setError(String(err?.message ?? err));
        throw err;
      }
    },
    [pairAddress, tokenAAddress, tokenBAddress, provider]
  );

  return {
    balanceA,
    balanceB,
    allowanceA,
    allowanceB,
    approve,
    addLiquidity,
    isLoading,
    isLoadingData,
    error,
  };
}
