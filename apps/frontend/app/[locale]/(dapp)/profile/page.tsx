'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import WalletConnector from '@/components/common/WalletConnector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Repeat, Layers, Plus, Minus, Twitter, Send, Disc } from 'lucide-react';

export default function ProfilePage() {
  const { data: user, isLoading: isUserLoading } = useQuery({ queryKey: ['userProfile'], queryFn: () => api.getUserProfile() });
  const { data: portfolio, isLoading: isPortfolioLoading } = useQuery({ queryKey: ['portfolio'], queryFn: () => api.getPortfolio() });

  const isLoading = isUserLoading || isPortfolioLoading;
  if (isLoading) return <div className="text-center p-10">Memuat profil dan portofolio...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Profil & Portofolio</h1>
        <p className="text-gray-500">Detail akun dan ringkasan aset DeFi Anda.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Informasi Akun</CardTitle></CardHeader>
            <CardContent>
              <p><strong>Username:</strong> {user?.username}</p>
              <p><strong>Level:</strong> <span className="font-semibold capitalize">{user?.level}</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Akun Terhubung</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <WalletConnector />
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Twitter size={20} /> Twitter</span>
                  {user?.socials?.twitter ? <span className="text-sm font-semibold text-green-600">Terhubung: @{user.socials.twitter}</span> : <button className="text-sm text-blue-500">Hubungkan</button>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
           <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Portofolio Aset DeFi</CardTitle>
                    <span className="font-bold text-2xl">${portfolio?.totalUsdValue.toFixed(2)}</span>
                </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {portfolio?.positions.length > 0 ? portfolio?.positions.map((pos: any) => (
                    <div key={pos.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md border-b">
                        <div className="flex items-center gap-3">
                            {pos.type === 'amm' && <Layers className="w-5 h-5 text-blue-500"/>}
                            {pos.type === 'lending_supply' && <Plus className="w-5 h-5 text-green-500"/>}
                            {pos.type === 'lending_borrow' && <Minus className="w-5 h-5 text-red-500"/>}
                            {pos.type === 'staking' && <Layers className="w-5 h-5 text-purple-500"/>}
                            <div>
                                <p className="font-semibold">{pos.asset}</p>
                                <p className="text-xs text-gray-500 capitalize">{pos.type.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <span className="font-mono text-right font-semibold">${pos.usdValue.toFixed(2)}</span>
                    </div>
                )) : <p className="text-center text-gray-500 py-8">Anda belum memiliki posisi di DeFi.</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>Aktivitas Terbaru</CardTitle></CardHeader>
              <CardContent>
                  <div className="space-y-3">
                      {portfolio?.recentActivity.map((act: any) => (
                          <div key={act.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-3">
                                  <Repeat className="w-4 h-4 text-gray-400"/>
                                  <p>{act.description}</p>
                              </div>
                              <p className="text-gray-500">{act.timestamp}</p>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}