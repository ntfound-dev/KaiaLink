// apps/frontend/utils/keplr.ts
/**
 * Keplr stub untuk proyek yang tidak memakai Keplr (Kaia testnet).
 * Gunakan guard `isKeplrSupported` sebelum memanggil getOfflineSignerSafe.
 */

export const isKeplrSupported = false;

export async function waitForKeplr(_timeout: number = 5000): Promise<undefined> {
  return undefined;
}

export async function getOfflineSignerSafe(_chainId: string): Promise<never> {
  throw new Error('Keplr tidak didukung pada build ini (Kaia testnet).');
}
