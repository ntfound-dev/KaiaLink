'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Award, Trophy, Medal } from 'lucide-react';

type Profile = {
  username?: string;
  points?: number | string;
  rank?: number | string;
  level?: number | string;
};

export default function HomePage(): JSX.Element {
  // pastikan queryFn memanggil fungsi (binding aman)
  const { data: profileData, isLoading, isError } = useQuery<Profile, Error>({
    queryKey: ['myProfile'],
     queryFn: () => (api as unknown as { getMyProfile: () => Promise<Profile> }).getMyProfile(),
  });

  if (isLoading) {
    return <div className="p-10 text-center">Memuat data...</div>;
  }
  if (isError) {
    return <div className="p-10 text-center text-red-500">Gagal memuat data.</div>;
  }

  const displayName = profileData?.username ?? 'Pengguna';

  // Normalisasi angka untuk tampilan
  const pointsNumber = Number(profileData?.points ?? 0);
  const pointsDisplay = Number.isFinite(pointsNumber) ? pointsNumber.toLocaleString() : '0';

  // Rank bisa number atau string
  const rankDisplay =
    profileData?.rank != null
      ? typeof profileData.rank === 'number'
        ? profileData.rank.toLocaleString()
        : String(profileData.rank)
      : 'N/A';

  const levelDisplay = profileData?.level ?? 'Bronze';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Selamat Datang, {displayName}!</h1>
        <p className="mt-1 text-gray-500">Ini adalah ringkasan progres Anda di KaiaLink.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center space-x-4 rounded-lg bg-white p-6 shadow">
          <div className="rounded-full bg-blue-100 p-3">
            <Award className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Poin</h2>
            <p className="text-2xl font-bold">{pointsDisplay}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 rounded-lg bg-white p-6 shadow">
          <div className="rounded-full bg-green-100 p-3">
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Peringkat Global</h2>
            <p className="text-2xl font-bold">#{rankDisplay}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 rounded-lg bg-white p-6 shadow">
          <div className="rounded-full bg-purple-100 p-3">
            <Medal className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Level Saat Ini</h2>
            <p className="text-2xl font-bold">{levelDisplay}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-gray-50 p-6 text-center">
          {/* tombol ke misi */}
          <Link href="/missions" className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white">
            Ke Misi
          </Link>
        </div>
        <div className="rounded-lg border bg-gray-50 p-6 text-center">
          {/* tombol ke defi */}
          <Link href="/defi" className="inline-block rounded-md bg-green-600 px-4 py-2 text-white">
            Ke DeFi
          </Link>
        </div>
      </div>
    </div>
  );
}
