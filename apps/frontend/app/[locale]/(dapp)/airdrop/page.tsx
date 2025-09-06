'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Gift, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AirdropPage() {
  const { data: airdropData, isLoading } = useQuery({ 
    queryKey: ['airdropData'], // Kunci query yang unik
    queryFn: () => api.getAirdropData() 
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Klaim Airdrop LINKA</h1>
        <p className="text-gray-500">Halaman ini akan aktif setelah Token Generation Event (TGE).</p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Status Airdrop Anda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
            <Gift className="w-16 h-16 text-blue-500 mb-4" />
            
            {isLoading ? (
                <div className="space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p>Memeriksa kelayakan...</p>
                </div>
            ) : (
                airdropData?.isEligible ? (
                    <>
                    <p className="text-green-600 font-semibold flex items-center gap-2">
                        <CheckCircle size={20}/> Selamat! Anda berhak mendapatkan Airdrop.
                    </p>
                    <p className="text-5xl font-bold my-4">{airdropData?.claimableAmount.toLocaleString()} LINKA</p>
                    <Button 
                        disabled 
                        className="mt-4 px-8 py-3 h-auto text-lg cursor-not-allowed"
                        size="lg"
                    >
                        Klaim (Belum Aktif)
                    </Button>
                    </>
                ) : (
                    <p className="text-red-600 font-semibold flex items-center gap-2">
                        <XCircle size={20}/> Anda belum memenuhi syarat untuk airdrop.
                    </p>
                )
            )}
        </CardContent>
      </Card>
    </div>
  );
}

