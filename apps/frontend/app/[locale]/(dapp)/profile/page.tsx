'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import WalletConnector from '@/components/common/WalletConnector';
import { Copy } from 'lucide-react';

export default function ProfilePage() {
  const { data: user, isLoading: isUserLoading } = useQuery({ queryKey: ['userProfile'], queryFn: () => api.getUserProfile() });
  const { data: portfolio, isLoading: isPortfolioLoading } = useQuery({ queryKey: ['portfolio'], queryFn: () => api.getPortfolio() });

  const isLoading = isUserLoading || isPortfolioLoading;

  if (isLoading) return <div className="text-center p-10">Memuat profil dan portofolio...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Profil & Portofolio</h1>
        <p className="text-gray-500">Semua detail akun dan ringkasan aset DeFi Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Info Profil */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 border rounded-lg bg-white shadow-lg">
            <h2 className="font-bold text-xl mb-4">Informasi Akun</h2>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Level:</strong> <span className="font-semibold capitalize">{user?.level}</span></p>
          </div>
          <div className="p-6 border rounded-lg bg-white shadow-lg">
            <h2 className="font-bold text-xl mb-4">Dompet & Sosial</h2>
            <WalletConnector />
            <div className="mt-4">
                <h3 className="font-semibold">Akun Sosial Terhubung:</h3>
                {user?.socials?.twitter ? <p>Twitter: @{user.socials.twitter}</p> : <p className="text-gray-400">Belum ada</p>}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Portofolio DeFi */}
        <div className="lg:col-span-2 p-6 border rounded-lg bg-white shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl">Aset DeFi Anda</h2>
            <span className="font-bold text-2xl">${portfolio?.totalUsdValue.toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            {portfolio?.positions.length > 0 ? portfolio?.positions.map(pos => (
                <div key={pos.id} className="grid grid-cols-3 items-center p-3 hover:bg-gray-50 rounded-md">
                    <span className="font-semibold">{pos.asset}</span>
                    <span className="text-sm text-gray-500 capitalize">{pos.type.replace('_', ' ')}</span>
                    <span className="font-mono text-right">${pos.usdValue.toFixed(2)}</span>
                </div>
            )) : (
              <p className="text-center text-gray-500 py-8">Anda belum memiliki posisi di DeFi.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}