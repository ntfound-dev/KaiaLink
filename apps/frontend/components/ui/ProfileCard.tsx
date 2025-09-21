'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Gem } from 'lucide-react';
import type { Profile } from '@/types/shared';

export default function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Card className="card">
      <CardHeader className="card-header">
        <CardTitle className="card-title">@{profile?.username ?? 'user'}</CardTitle>
      </CardHeader>

      <CardContent className="card-content">
        <p className="wallet-address">{profile?.walletAddress ?? ''}</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="rounded-full bg-gray-100 p-2">
            {profile?.hasSbt && profile?.sbtUrl ? (
              // Ensure sbtUrl domain added to next.config.js images.domains or remotePatterns
              <Image src={profile.sbtUrl} alt="SBT" width={40} height={40} className="rounded-full" />
            ) : (
              <Gem className="h-8 w-8 text-gray-400" />
            )}
          </div>

          <div>
            <p className="font-semibold">{profile?.hasSbt ? 'Terverifikasi' : 'Belum Dimiliki'}</p>
            <p className="text-xs text-gray-500">Tanda identitas on-chain Anda</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
