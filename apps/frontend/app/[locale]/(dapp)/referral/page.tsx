'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Copy, Users, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function ReferralPage() {
  const { data: referralData, isLoading } = useQuery({ 
    queryKey: ['referralData'], // Menggunakan key yang unik
    queryFn: () => api.getReferralData() 
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Program Referral</h1>
        <p className="text-gray-500">Ajak teman Anda dan dapatkan bonus poin bersama!</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bagikan Kode Unik Anda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">Salin dan bagikan kode ini kepada teman Anda.</p>
          <div className="flex items-center gap-4 p-3 bg-gray-100 rounded-md border-2 border-dashed">
            <span className="font-mono text-lg flex-grow">{isLoading ? 'Memuat...' : referralData?.referralCode}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(referralData?.referralCode || '')} 
              className="p-2 hover:bg-gray-200 rounded-md"
              title="Salin Kode"
              disabled={isLoading}
            >
              <Copy className="w-5 h-5"/>
            </button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Undangan</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{referralData?.totalReferrals || 0}</div>
                 <p className="text-xs text-muted-foreground">Teman yang telah bergabung</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bonus Poin</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{referralData?.totalBonusPoints || 0}</div>
                <p className="text-xs text-muted-foreground">Poin yang didapat dari referral</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}