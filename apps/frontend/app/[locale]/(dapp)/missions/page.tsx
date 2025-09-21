'use client';

import React from 'react';
import { useMissions } from '@/hooks/useMissions';
import MissionCard from '@/components/ui/MissionCard';
import type { Mission } from '@/types/shared';

export default function MissionsPage() {
  const { data: missions = [], isLoading, completeMission, isVerifying } = useMissions();

  const handleActionClick = (mission: Mission) => {
    if (mission.actionUrl && String(mission.actionUrl).startsWith('http')) {
      window.open(String(mission.actionUrl), '_blank', 'noopener');
      return;
    }
    completeMission(mission.id);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-gray-500">Memuat daftar misi...</div>
      </div>
    );
  }

  const socialMissions = missions.filter((m) => m.type === 'social');
  const onchainMissions = missions.filter((m) => m.type === 'on-chain' || m.type === 'onchain' || m.type === 'tvl');

  return (
    <main className="p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Daftar Misi</h1>
        <p className="text-gray-500">Selesaikan tugas untuk mendapatkan poin dan naik level!</p>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Misi Sosial</h2>
        {socialMissions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {socialMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onActionClick={handleActionClick}
                isVerifying={isVerifying}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400">Tidak ada misi sosial saat ini.</div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Misi On-Chain</h2>
        {onchainMissions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {onchainMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onActionClick={handleActionClick}
                isVerifying={isVerifying}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400">Tidak ada misi on-chain saat ini.</div>
        )}
      </section>
    </main>
  );
}
