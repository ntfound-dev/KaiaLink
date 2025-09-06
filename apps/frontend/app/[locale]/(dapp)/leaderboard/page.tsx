'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery({ 
    queryKey: ['leaderboard'], 
    queryFn: () => api.getLeaderboard() 
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Papan Peringkat (Leaderboard)</h1>
        <p className="text-gray-500">Lihat peringkat Anda di antara semua pengguna KaiaLink.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg border">
        {isLoading ? (
          <p>Memuat data peringkat...</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3">Peringkat</th>
                <th className="p-3">Username</th>
                <th className="p-3 text-right">Total Poin</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.map((user, index) => (
                <tr key={user.rank} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-bold text-lg">{user.rank}{index === 0 && <Trophy className="inline w-5 h-5 ml-2 text-yellow-500"/>}</td>
                  <td className="p-3">{user.username}</td>
                  <td className="p-3 text-right font-mono font-semibold">{user.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}