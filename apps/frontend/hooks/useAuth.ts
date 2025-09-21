'use client';

import { useProfile } from './useUserProfile';
import { useLiff } from './useLiff';

/**
 * Hook pembantu (helper) untuk mendapatkan status autentikasi gabungan.
 * Pengguna dianggap "terautentikasi" jika sesi LIFF aktif DAN profil dari backend berhasil dimuat.
 */
export const useAuth = () => {
  const { data: userProfile, isLoading: isProfileLoading } = useProfile();
  const { isLoggedIn: isLiffLoggedIn, isLoading: isLiffLoading } = useLiff();

  const isAuthenticated = !!userProfile && isLiffLoggedIn;
  const isLoading = isProfileLoading || isLiffLoading;

  return {
    user: userProfile,
    isAuthenticated,
    isLoading,
  };
};
