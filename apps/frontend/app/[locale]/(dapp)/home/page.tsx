'use client';

import { useUserProfile } from '@/hooks/useUserProfile';
import Link from 'next/link';
import Image from 'next/image';
import { Award, Gem, Medal } from 'lucide-react';

export default function HomePage() {
  const { data: user, isLoading, isError } = useUserProfile();

  if (isLoading) return <div className="text-center p-10">Memuat data...</div>;
  if (isError) return <div className="text-center p-10 text-red-500">Gagal memuat data.</div>;

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Selamat Datang, {user?.username}!</h1>
        <p className="text-gray-500 mt-1">Ini adalah ringkasan progres Anda di KaiaLink.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-6 rounded-lg bg-white shadow-lg flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Award className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-gray-600 font-semibold">Total Poin</h2>
            {/* PERBAIKAN: Memberikan nilai default 0 sebelum memanggil toLocaleString() */}
            <p className="text-3xl font-bold text-gray-800">{(user?.points || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white shadow-lg flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Medal className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-gray-600 font-semibold">Level Saat Ini</h2>
            <p className="text-3xl font-bold text-gray-800 capitalize">{user?.level || 'Bronze'}</p>
          </div>
        </div>
        
        <div className="p-6 rounded-lg bg-white shadow-lg flex items-center space-x-4">
          <div className="bg-gray-200 p-2 rounded-full">
             {user?.sbtUrl ? (
              <Image src={user.sbtUrl} alt={`${user.level} SBT`} width={48} height={48} />
            ) : (
              <Gem className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <div>
            <h2 className="text-gray-600 font-semibold">Soulbound Token</h2>
            <p className="text-xl font-bold text-gray-800">Terverifikasi</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="text-center p-6 bg-gray-50 rounded-lg border">
            <h2 className="text-xl font-bold">Selesaikan Misi, Dapatkan Poin!</h2>
            <p className="text-gray-600 my-2">Misi baru menanti Anda setiap hari.</p>
            <Link href="/missions">
              <button className="mt-2 px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-transform hover:scale-105">
                Mulai Misi
              </button>
            </Link>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-lg border">
            <h2 className="text-xl font-bold">Jelajahi Dunia DeFi</h2>
            <p className="text-gray-600 my-2">Tukar aset, tambah likuiditas, dan raih imbalan.</p>
            <Link href="/defi">
              <button className="mt-2 px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-transform hover:scale-105">
                Masuk ke DeFi
              </button>
            </Link>
          </div>
      </div>
    </div>
  );
}
