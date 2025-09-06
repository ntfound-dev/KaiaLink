'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Hook untuk mengambil dan me-cache data profil pengguna yang sedang login.
 * Menggunakan React Query untuk menangani state loading, error, dan caching secara otomatis.
 */
export const useUserProfile = () => {
  return useQuery({
    // 'userProfile' adalah kunci unik untuk query ini di cache
    queryKey: ['userProfile'],
    // queryFn adalah fungsi yang akan dipanggil untuk mengambil data.
    // Ini akan memanggil 'getUserProfile' dari mock.ts atau real.ts tergantung mode.
    queryFn: () => api.getUserProfile(),
    // Data akan dianggap 'fresh' selama 5 menit sebelum React Query mencoba mengambilnya lagi.
    staleTime: 5 * 60 * 1000, 
  });
};