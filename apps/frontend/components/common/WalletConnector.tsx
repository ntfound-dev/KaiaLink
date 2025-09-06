// components/common/WalletConnector.tsx
'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors'

export default function WalletConnector() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p>Terhubung dengan: <span className="font-mono">{`${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`}</span></p>
        <button 
          onClick={() => disconnect()} 
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
        >
          Putuskan Dompet
        </button>
      </div>
    );
  }

  return (
    <button 
      // --- LOGIKA UNTUK MENGHUBUNGKAN DOMPET ---
      // Untuk Kaikas, kita mungkin perlu deteksi khusus
      // Untuk WalletConnect akan membuka modal secara otomatis
      onClick={() => connect({ connector: injected() })} // Contoh konektor, bisa diganti WalletConnect
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Hubungkan Dompet
    </button>
  );
}