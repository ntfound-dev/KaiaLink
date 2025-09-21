'use client';

import React from 'react';
import '@/styles/profile.css';
import { useProfile } from '@/hooks/useUserProfile';
import ProfileCard from '@/components/ui/ProfileCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Medal, Users, CheckSquare, BarChart3 } from 'lucide-react';
import WalletConnector from '@/components/common/WalletConnector';
import type { Profile } from '@/types/shared';
import '@/styles/profile.css';

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="stat-card" role="group" aria-label={label}>
    <div className="left">
      <span className="icon-badge">{icon}</span>
      <span className="muted">{label}</span>
    </div>
    <div className="value">{value}</div>
  </div>
);

export default function ProfilePage() {
  const { data: profileData, isLoading, isError, error } = useProfile();

  if (isLoading) return <div className="p-10 text-center">Memuat profil Anda...</div>;
  if (isError) return <div className="p-10 text-center text-red-500">Gagal memuat profil: {error?.message}</div>;

  const points = profileData?.points ?? 0;

  return (
    <div className="space-y-8 profile-root">
      <div className="profile-header">
        <h1 className="text-3xl font-bold md:text-4xl">Profil Pengguna</h1>
        <p className="text-gray-500">Ringkasan poin, peringkat, dan aktivitas Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <ProfileCard profile={profileData as Profile} />

          <Card className="card">
            <CardHeader className="card-header">
              <CardTitle className="card-title">Akun Terhubung</CardTitle>
            </CardHeader>
            <CardContent className="card-content">
              <div className="wallet-connector">
                <WalletConnector />
              </div>

              <div className="socials pt-4 mt-4">
                <div className="social-row">
                  <span className="service-name">Twitter</span>
                  {profileData?.socials?.twitter ? (
                    <span className="text-sm font-semibold text-green-600">Terhubung: @{profileData.socials.twitter}</span>
                  ) : (
                    <a href="/api/auth/twitter" className="link text-sm">Hubungkan</a>
                  )}
                </div>
                <div className="social-row">
                  <span className="service-name">Discord</span>
                  {profileData?.socials?.discord ? <span className="text-sm font-semibold text-green-600">Terhubung</span> : <a href="/api/auth/discord" className="link text-sm">Hubungkan</a>}
                </div>
                <div className="social-row">
                  <span className="service-name">Telegram</span>
                  {profileData?.socials?.telegram ? <span className="text-sm font-semibold text-green-600">Terhubung</span> : <a href="/api/auth/telegram" className="link text-sm">Hubungkan</a>}
                </div>
                <div className="social-row">
                  <span className="service-name font-bold text-green-600">LINE</span>
                  {profileData?.socials?.line ? <span className="text-sm font-semibold text-green-600">Terhubung</span> : <a href="/api/auth/line" className="link text-sm">Hubungkan</a>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="card">
            <CardHeader className="card-header">
              <CardTitle className="card-title">Statistik Saya</CardTitle>
            </CardHeader>
            <CardContent className="card-content grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard icon={<Medal className="text-yellow-500" />} label="Peringkat Poin" value={`#${profileData?.rank ?? 'N/A'}`} />
              <StatCard icon={<BarChart3 className="text-blue-500" />} label="Total Poin" value={(points ?? 0).toLocaleString()} />
              <StatCard icon={<Users className="text-green-500" />} label="Total Referral" value={profileData?.totalReferrals ?? 0} />
              <StatCard icon={<CheckSquare className="text-purple-500" />} label="Misi Selesai" value={profileData?.missionsCompleted ?? 0} />
            </CardContent>
          </Card>

          <Card className="card">
            <CardHeader className="card-header">
              <CardTitle className="card-title">Statistik On-Chain</CardTitle>
            </CardHeader>
            <CardContent className="card-content onchain">
              {profileData?.defiStats ? (
                <div className="space-y-3">
                  <p><strong>Total Volume Swap:</strong> ${profileData.defiStats.totalSwapVolume ? profileData.defiStats.totalSwapVolume.toLocaleString() : '0'}</p>
                  <p><strong>Total Volume Staking:</strong> ${profileData.defiStats.totalStakingVolume ? profileData.defiStats.totalStakingVolume.toLocaleString() : '0'}</p>
                  <p><strong>Total Volume Supply (Lending):</strong> ${profileData.defiStats.totalLendSupplyVolume ? profileData.defiStats.totalLendSupplyVolume.toLocaleString() : '0'}</p>
                </div>
              ) : (
                <p className="empty-state">Belum ada aktivitas on-chain yang tercatat.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
