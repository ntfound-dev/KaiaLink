'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Gift } from 'lucide-react';

export default function AirdropPage() {
  const { data: airdropData, isLoading } = useQuery({ 
    queryKey: ['airdrop'], 
    queryFn: () => api.getAirdropData() 
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Klaim Airdrop LINKA</h1>
        <p className="text-gray-500">Halaman ini akan aktif setelah Token Generation Event (TGE).</p>
      </div>
      
      <div className="p-8 rounded-lg bg-white shadow-lg border flex flex-col items-center text-center">
        <Gift className="w-16 h-16 text-blue-500 mb-4" />
        <h2 className="font-bold text-2xl mb-2">Status Airdrop Anda</h2>
        {isLoading ? <p>Memeriksa kelayakan...</p> : (
          airdropData?.isEligible ? (
            <>
              <p className="text-green-600 font-semibold">Selamat! Anda berhak mendapatkan Airdrop.</p>
              <p className="text-4xl font-bold my-4">{airdropData?.claimableAmount.toLocaleString()} LINKA</p>
              <button disabled className="mt-4 px-8 py-3 bg-gray-400 text-white font-bold rounded-lg cursor-not-allowed">
                Klaim (Belum Aktif)
              </button>
            </>
          ) : (
            <p className="text-red-600 font-semibold">Anda belum memenuhi syarat untuk airdrop.</p>
          )
        )}
      </div>
    </div>
  );
}