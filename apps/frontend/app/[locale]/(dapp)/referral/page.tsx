'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Copy, Users } from 'lucide-react';

export default function ReferralPage() {
  const { data: referralData, isLoading } = useQuery({ 
    queryKey: ['referral'], 
    queryFn: () => api.getReferralData() 
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Program Referral</h1>
        <p className="text-gray-500">Ajak teman Anda dan dapatkan bonus poin bersama!</p>
      </div>

      <div className="p-6 rounded-lg bg-white shadow-lg border">
        <h2 className="font-bold text-xl mb-3">Kode Referral Unik Anda</h2>
        <div className="flex items-center gap-4 p-3 bg-gray-100 rounded-md border-2 border-dashed">
          <span className="font-mono text-lg flex-grow">{referralData?.referralCode}</span>
          <button onClick={() => navigator.clipboard.writeText(referralData?.referralCode || '')} className="p-2 hover:bg-gray-200 rounded-md">
            <Copy className="w-5 h-5"/>
          </button>
        </div>
      </div>
      
      <div className="p-6 rounded-lg bg-white shadow-lg border">
        <h2 className="font-bold text-xl mb-3">Statistik Anda</h2>
        {isLoading ? <p>Memuat statistik...</p> : (
             <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-500"/>
                    <div>
                        <p className="text-gray-500">Total Undangan</p>
                        <p className="font-bold text-2xl">{referralData?.totalReferrals}</p>
                    </div>
                </div>
                {/* Tambahkan statistik lain di sini */}
             </div>
        )}
      </div>
    </div>
  );
}