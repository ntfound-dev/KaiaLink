// apps/frontend/hooks/useSwap.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers, MaxUint256 } from 'ethers';
import api from '@/lib/api';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

const UNIV2_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) returns (uint[] memory amounts)',
];

type TokenLike = { symbol?: string; address: string };

type BigLike = bigint | number | string;

/** safe coercer -> bigint (no bigint literal syntax) */
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

export function useSwap(
  tokenIn: TokenLike,
  tokenOut: TokenLike,
  amountIn: string | number,
  opts?: { routerAddress?: string | null; providerOverride?: any }
) {
  const [balanceIn, setBalanceIn] = useState<string | number>('0');
  const [decimalsIn, setDecimalsIn] = useState<number>(18);
  const [decimalsOut, setDecimalsOut] = useState<number>(18);
  const [amountOut, setAmountOut] = useState<string>('');
  const [amountOutRaw, setAmountOutRaw] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allowance, setAllowance] = useState<string | number>('0');

  const routerAddress = opts?.routerAddress ?? null;

  // provider: allow override for tests
  const provider = useMemo(() => {
    if (opts?.providerOverride) return opts.providerOverride;
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        return new ethers.BrowserProvider((window as any).ethereum as any);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [opts?.providerOverride]);

  // helper to get signer (async in v6)
  const getSigner = useCallback(async () => {
    if (!provider) return undefined;
    try {
      return await provider.getSigner();
    } catch {
      return undefined;
    }
  }, [provider]);

  // read token decimals, balance, allowance
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!provider || !tokenIn?.address) {
          if (mounted) {
            setBalanceIn('0');
            setAllowance('0');
          }
          return;
        }

        const tokenInContract = new ethers.Contract(tokenIn.address, ERC20_ABI, provider as any);
        const tokenOutContract = new ethers.Contract(tokenOut.address, ERC20_ABI, provider as any);

        // decimals
        try {
          const dIn = await tokenInContract.decimals();
          if (mounted) setDecimalsIn(Number(dIn));
        } catch {
          if (mounted) setDecimalsIn(18);
        }
        try {
          const dOut = await tokenOutContract.decimals();
          if (mounted) setDecimalsOut(Number(dOut));
        } catch {
          if (mounted) setDecimalsOut(18);
        }

        // owner check (get signer address if available)
        let owner: string | undefined;
        try {
          const signer = await getSigner();
          owner = signer ? await signer.getAddress() : undefined;
        } catch {
          owner = undefined;
        }

        if (owner) {
          const [balBn, alBn] = await Promise.all([
            tokenInContract.balanceOf(owner),
            tokenInContract.allowance(owner, routerAddress ?? ADDRESS_ZERO),
          ]);
          if (!mounted) return;
          // v6 returns bigint for uint256
          setBalanceIn(String(toBig(balBn)));
          setAllowance(String(toBig(alBn)));
        } else {
          if (mounted) {
            setBalanceIn('0');
            setAllowance('0');
          }
        }
      } catch (err) {
        console.error('useSwap token read error', err);
        if (mounted) {
          setBalanceIn('0');
          setAllowance('0');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [provider, getSigner, tokenIn?.address, tokenOut?.address, routerAddress]);

  // compute amountOut estimate
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!amountIn || Number(amountIn) <= 0) {
          if (mounted) {
            setAmountOut('');
            setAmountOutRaw(null);
          }
          return;
        }

        // 1) backend quote (preferred)
        if (api && typeof (api as any).getSwapQuote === 'function') {
          try {
            const q = await (api as any).getSwapQuote(tokenIn.address, tokenOut.address, String(amountIn));
            if (!mounted) return;
            if (q?.amountOutRaw) {
              const outBn = toBig(q.amountOutRaw);
              setAmountOutRaw(outBn);
              const formatted =
                typeof q.amountOutFormatted === 'string' ? q.amountOutFormatted : ethers.formatUnits(outBn, q?.decimalsOut ?? decimalsOut);
              setAmountOut(formatted);
            } else if (q?.amountOut) {
              setAmountOut(String(q.amountOut));
              setAmountOutRaw(null);
            } else {
              setAmountOut(String(q));
              setAmountOutRaw(null);
            }
            return;
          } catch {
            // fallback to on-chain
          }
        }

        // 2) on-chain getAmountsOut via router (requires routerAddress + provider)
        if (routerAddress && provider) {
          try {
            const router = new ethers.Contract(routerAddress, UNIV2_ROUTER_ABI, provider as any);
            const inUnits = ethers.parseUnits(String(amountIn), decimalsIn); // bigint
            const amounts: bigint[] = await router.getAmountsOut(inUnits, [tokenIn.address, tokenOut.address]);
            const out = amounts[amounts.length - 1];
            if (!mounted) return;
            setAmountOutRaw(out);
            setAmountOut(ethers.formatUnits(out, decimalsOut));
            return;
          } catch (err) {
            console.warn('router getAmountsOut failed', err);
          }
        }

        // fallback: clear
        if (mounted) {
          setAmountOut('');
          setAmountOutRaw(null);
        }
      } catch (err) {
        console.error('useSwap quote error', err);
        if (mounted) {
          setAmountOut('');
          setAmountOutRaw(null);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [amountIn, tokenIn.address, tokenOut.address, routerAddress, provider, decimalsIn, decimalsOut]);

  const needsApproval = useMemo(() => {
    try {
      const alBn = toBig(allowance || '0');
      const req = ethers.parseUnits(String(amountIn || '0'), decimalsIn);
      return alBn < req;
    } catch {
      return false;
    }
  }, [allowance, amountIn, decimalsIn]);

  const approve = useCallback(async () => {
    const signer = await getSigner();
    if (!signer) throw new Error('Wallet belum terhubung');
    if (!tokenIn?.address) throw new Error('Token input tidak valid');
    if (!routerAddress) throw new Error('Router address tidak tersedia (diperlukan untuk approve).');

    setIsLoading(true);
    try {
      const token = new ethers.Contract(tokenIn.address, ERC20_ABI, signer as any);
      const tx = await token.approve(routerAddress, MaxUint256 as any);
      await tx.wait?.(1);
      // refresh allowance
      const owner = await signer.getAddress();
      const refreshed = await new ethers.Contract(tokenIn.address, ERC20_ABI, provider as any).allowance(owner, routerAddress);
      setAllowance(String(toBig(refreshed)));
      setIsLoading(false);
      return tx;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, [getSigner, tokenIn?.address, routerAddress, provider]);

  /**
   * swap(slippagePercent)
   * - prefer backend api.swap
   * - otherwise on-chain swap via router
   */
  const swap = useCallback(
    async (slippagePercent = 1) => {
      if (!amountIn || Number(amountIn) <= 0) throw new Error('Jumlah input tidak valid');

      // use backend if available
      if (api && typeof (api as any).swap === 'function') {
        setIsLoading(true);
        try {
          const res = await (api as any).swap({
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            amountIn: String(amountIn),
            slippagePercent,
          });
          setIsLoading(false);
          return res;
        } catch (err) {
          setIsLoading(false);
          throw err;
        }
      }

      // on-chain fallback
      const signer = await getSigner();
      if (!signer) throw new Error('Wallet belum terhubung');
      if (!routerAddress) throw new Error('Router address tidak tersedia untuk swap on-chain');

      setIsLoading(true);
      try {
        const router = new ethers.Contract(routerAddress, UNIV2_ROUTER_ABI, signer as any);
        const path = [tokenIn.address, tokenOut.address];
        const amountInUnits = ethers.parseUnits(String(amountIn), decimalsIn); // bigint

        // fetch on-chain amounts to avoid stale quote
        const amounts: bigint[] = await router.getAmountsOut(amountInUnits, path);
        const out: bigint = amounts[amounts.length - 1];

        // compute amountOutMin using integer bigint math
        const slippageBp = BigInt(Math.round(Number(slippagePercent) * 100)); // e.g. 0.5% -> 50
        const amountOutMin = (out * (BigInt(10000) - slippageBp)) / BigInt(10000);

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
        const tx = await router.swapExactTokensForTokens(amountInUnits, amountOutMin, path, await signer.getAddress(), deadline);
        await tx.wait?.(1);

        // refresh balance & allowance
        try {
          const owner = await signer.getAddress();
          const bal = await new ethers.Contract(tokenIn.address, ERC20_ABI, provider as any).balanceOf(owner);
          const al = await new ethers.Contract(tokenIn.address, ERC20_ABI, provider as any).allowance(owner, routerAddress);
          setBalanceIn(String(toBig(bal)));
          setAllowance(String(toBig(al)));
        } catch (e) {
          console.warn('refresh after swap failed', e);
        }

        setIsLoading(false);
        return tx;
      } catch (err) {
        setIsLoading(false);
        throw err;
      }
    },
    [api, getSigner, routerAddress, tokenIn.address, tokenOut.address, amountIn, decimalsIn, provider]
  );

  // expose amountOutMin estimate calculated from current amountOutRaw & slippage on-demand
  const estimateMinReceived = useCallback(
    (slippagePercent = 1) => {
      try {
        if (!amountOutRaw) return '';
        const slippageBp = BigInt(Math.round(Number(slippagePercent) * 100));
        const amountOutMinBn = (amountOutRaw * (BigInt(10000) - slippageBp)) / BigInt(10000);
        return ethers.formatUnits(amountOutMinBn, decimalsOut);
      } catch {
        return '';
      }
    },
    [amountOutRaw, decimalsOut]
  );

  return {
    balanceIn,
    amountOut,
    amountOutRaw,
    estimateMinReceived,
    needsApproval,
    approve,
    swap,
    isLoading,
  } as const;
}

export default useSwap;
