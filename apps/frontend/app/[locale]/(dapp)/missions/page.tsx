'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Mission } from '@/types/shared';
import { CheckCircle, ExternalLink, LoaderCircle } from 'lucide-react';

export default function MissionsPage() {
  const [activeTab, setActiveTab] = useState<'social' | 'tvl'>('social');
  const queryClient = useQueryClient();
  
  const { data: missions = [], isLoading } = useQuery<Mission[]>({
    queryKey: ['missions'],
    queryFn: () => api.getMissions(),
  });

  const { mutate: performVerification, isPending: isVerifying, variables: verifyingMissionId } = useMutation({
    mutationFn: (missionId: string) => api.verifyMission(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
    onError: (error) => {
      alert(`Verifikasi gagal: ${error.message}`);
    }
  });

  const handleActionClick = (mission: Mission) => {
    if (mission.actionUrl && mission.actionUrl.startsWith('http')) {
      window.open(mission.actionUrl, '_blank');
    }
    // Verifikasi otomatis untuk misi simpel
    if (!mission.actionUrl || mission.id === 'daily-checkin') {
      performVerification(mission.id);
    }
  };

  if (isLoading) return <div className="text-center p-10">Memuat daftar misi...</div>;

  const filteredMissions = missions.filter(m => m.type === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Daftar Misi</h1>
        <p className="text-gray-500">Selesaikan tugas untuk mendapatkan poin dan naik level!</p>
      </div>

      <div className="flex border-b">
        <button onClick={() => setActiveTab('social')} className={`px-6 py-2 text-lg ${activeTab === 'social' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500'}`}>
          Misi Sosial
        </button>
        <button onClick={() => setActiveTab('tvl')} className={`px-6 py-2 text-lg ${activeTab === 'tvl' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500'}`}>
          Misi On-Chain
        </button>
      </div>

      <div className="space-y-4">
        {filteredMissions.length > 0 ? (
          filteredMissions.map((mission) => (
            <div key={mission.id} className="p-5 border rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold">{mission.title}</h3>
                <p className="text-sm text-gray-600">{mission.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg text-blue-500">+{mission.points} Poin</span>
                {mission.status === 'completed' ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-800">
                    <CheckCircle className="w-5 h-5 mr-2" /> Selesai
                  </span>
                ) : (
                  <button
                    onClick={() => handleActionClick(mission)}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center"
                  >
                    {isVerifying && verifyingMissionId === mission.id ? (
                      <LoaderCircle className="animate-spin w-5 h-5 mr-2" />
                    ) : (
                      mission.actionUrl && <ExternalLink className="w-5 h-5 mr-2" />
                    )}
                    {isVerifying && verifyingMissionId === mission.id ? 'Memproses...' : 'Kerjakan'}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-10">Tidak ada misi yang tersedia di kategori ini.</p>
        )}
      </div>
    </div>
  );
}