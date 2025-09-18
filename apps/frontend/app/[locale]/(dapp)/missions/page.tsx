'use client';

import { useState, FC } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Mission } from '@/types/shared';
import { CheckCircle, ExternalLink, LoaderCircle } from 'lucide-react';
import '@/styles/missions.css'; // pastikan path ini sesuai alias/project

// ============================================================================
// KOMPONEN KARTU MISI
// ============================================================================
interface MissionCardProps {
  mission: Mission;
  onActionClick: (mission: Mission) => void;
  isVerifying: boolean;
}

const MissionCard: FC<MissionCardProps> = ({ mission, onActionClick, isVerifying }) => (
  <article className="mission-card" aria-labelledby={`mission-title-${mission.id}`}>
    <div className="mission-info">
      <h3 id={`mission-title-${mission.id}`} className="mission-title">
        {mission.title}
      </h3>
      <p className="mission-desc">{mission.description}</p>
    </div>

    <div className="mission-meta">
      <span className="mission-points">+{mission.points} Poin</span>

      {mission.status === 'completed' ? (
        <span className="mission-completed" aria-label="Selesai">
          <CheckCircle className="icon-inline" /> Selesai
        </span>
      ) : (
        <button
          onClick={() => onActionClick(mission)}
          disabled={isVerifying}
          className="mission-btn"
          aria-disabled={isVerifying}
          aria-label={isVerifying ? 'Memproses...' : 'Kerjakan misi'}
        >
          {isVerifying ? (
            <>
              <span className="loader-circle" aria-hidden />
              Memproses...
            </>
          ) : (
            <>
              {mission.actionUrl && <ExternalLink className="icon-inline" />}
              Kerjakan
            </>
          )}
        </button>
      )}
    </div>
  </article>
);

// ============================================================================
// HALAMAN: MENAMPILKAN DUA KOLOM (SOSIAL & ON-CHAIN)
// ============================================================================
export default function MissionsPage() {
  const [verifyingMissionId, setVerifyingMissionId] = useState<string | number | null>(null);
  const queryClient = useQueryClient();

  // Ambil semua misi (normalisasi respons)
  const { data: missions = [], isLoading } = useQuery<Mission[]>({
    queryKey: ['missions'],
    queryFn: async () => {
      const res = await axios.get('/api/missions');
      const raw = res.data?.data ?? res.data?.missions ?? res.data;
      if (Array.isArray(raw)) return raw as Mission[];
      return [] as Mission[];
    },
    staleTime: 30_000,
  });

  // Mutation: panggil endpoint complete
  const mutation = useMutation<any, any, string>({
    mutationFn: (missionId: string) =>
      axios.post(`/api/missions/${missionId}/complete`).then(r => r.data),

    // Optimistic update
    onMutate: async (missionId: string) => {
      setVerifyingMissionId(missionId);
      await queryClient.cancelQueries({ queryKey: ['missions'] });
      const previousMissions = queryClient.getQueryData<Mission[]>(['missions']);

      queryClient.setQueryData<Mission[]>(['missions'], (old = []) =>
        old.map(m => (String(m.id) === String(missionId) ? { ...m, status: 'completed' } : m))
      );

      return { previousMissions };
    },

    // Rollback ketika error
    onError: (err: any, _newMissionId: string, context: any) => {
      if (context?.previousMissions) {
        queryClient.setQueryData(['missions'], context.previousMissions);
      }
      const message = err?.message ?? String(err) ?? 'Unknown error';
      // Ganti alert dengan toast sesuai preferensi
      alert(`Verifikasi gagal: ${message}`);
      setVerifyingMissionId(null);
    },

    // Selalu refetch dan clear verifying state
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      setVerifyingMissionId(null);
    },
  });

  // kompatibilitas isPending / isLoading (tanstack v5 vs v4)
  const mutationStatusIsPending = Boolean((mutation as any).isPending ?? (mutation as any).isLoading ?? false);

  // wrapper untuk memanggil mutate
  const completeMission = (missionId: string | number) => {
    mutation.mutate(String(missionId));
  };

  const handleActionClick = (mission: Mission) => {
    if (mission.actionUrl && mission.actionUrl.startsWith('http')) {
      window.open(mission.actionUrl, '_blank');
    }

    // Verifikasi semua misi yang tidak punya URL eksternal atau misi check-in
    if (!mission.actionUrl || mission.id === 'daily-checkin') {
      completeMission(mission.id);
    }
  };

  // Pisahkan menjadi dua list: sosial & on-chain (asumsi: mission.type === 'social' | 'tvl')
  const socialMissions = missions.filter(m => m.type === 'social');
  const onchainMissions = missions.filter(m => m.type === 'on-chain');

  if (isLoading) return <div className="p-10 text-center">Memuat daftar misi...</div>;

  return (
    <main className="missions-page">
      <header className="missions-header">
        <h1 className="text-3xl font-bold md:text-4xl">Daftar Misi</h1>
        <p className="text-gray-500">Selesaikan tugas untuk mendapatkan poin dan naik level!</p>
      </header>

      <div className="missions-grid">
        {/* KOLOM 1: MISI SOSIAL */}
        <section className="missions-section" aria-labelledby="social-title">
          <h2 id="social-title">Misi Sosial</h2>
          <div>
            {socialMissions.length > 0 ? (
              socialMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onActionClick={handleActionClick}
                  isVerifying={mutationStatusIsPending && String(verifyingMissionId) === String(mission.id)}
                />
              ))
            ) : (
              <div className="missions-empty">Tidak ada misi sosial saat ini.</div>
            )}
          </div>
        </section>

        {/* KOLOM 2: MISI ON-CHAIN */}
        <section className="missions-section" aria-labelledby="onchain-title">
          <h2 id="onchain-title">Misi On-Chain</h2>
          <div>
            {onchainMissions.length > 0 ? (
              onchainMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onActionClick={handleActionClick}
                  isVerifying={mutationStatusIsPending && String(verifyingMissionId) === String(mission.id)}
                />
              ))
            ) : (
              <div className="missions-empty">Tidak ada misi on-chain saat ini.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
