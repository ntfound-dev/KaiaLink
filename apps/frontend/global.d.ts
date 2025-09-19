// global.d.ts
export {}; // treat as module augmentation

declare global {
  interface Window {
    // optional karena kita tidak menggunakan Keplr di build ini, tapi deklarasi mencegah TS errors
    keplr?: any;
    getOfflineSigner?: (chainId: string) => any;
  }
}
