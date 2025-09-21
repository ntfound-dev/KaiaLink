'use client';

import { useQuery } from '@tanstack/react-query';
import apiDefault, { getMyProfile as getMyProfileFromIndex } from '@/lib/api';
import type { Profile } from '@/types/shared';

// Prefer import from central api export. Fallback ke real if not available:
const getMyProfile = async () => {
  // If index exports a helper, use it; otherwise try apiDefault.getMyProfile or apiDefault.getUserProfile
  if (typeof getMyProfileFromIndex === 'function') return getMyProfileFromIndex();
  if (typeof (apiDefault as any).getMyProfile === 'function') return (apiDefault as any).getMyProfile();
  if (typeof (apiDefault as any).getUserProfile === 'function') return (apiDefault as any).getUserProfile();
  // fallback: try real endpoint via apiDefault (may throw)
  if (typeof (apiDefault as any).getMyProfile === 'undefined') {
    throw new Error('getMyProfile not available on api exports - check apps/frontend/lib/api exports');
  }
  return (apiDefault as any).getMyProfile();
};

export function useProfile() {
  return useQuery<Profile, Error>({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
