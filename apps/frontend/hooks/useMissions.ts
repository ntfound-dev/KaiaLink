'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/real';
import type { Mission } from '@/types/shared';

export function useMissions() {
  const queryClient = useQueryClient();

  const missionsQuery = useQuery<Mission[]>({
    queryKey: ['missions'],
    queryFn: async () => {
      const res = await api.getMissions();
      if (Array.isArray(res)) return res;
      if (Array.isArray((res as any)?.data)) return (res as any).data;
      return [];
    },
    staleTime: 30_000,
  });

  // keempat generic adalah tipe context yang dikembalikan onMutate
  const mutation = useMutation<void, unknown, string, { previous?: Mission[] }>({
    mutationFn: async (missionId: string) => {
      await api.verifyMission(missionId);
    },
    onMutate: async (missionId: string) => {
      await queryClient.cancelQueries({ queryKey: ['missions'] });
      const previous = queryClient.getQueryData<Mission[]>(['missions']);

      queryClient.setQueryData<Mission[]>(['missions'], (old = []) =>
        old.map((m) => (String(m.id) === String(missionId) ? { ...m, status: 'completed' } : m))
      );

      // kembalikan context yang ter-tipiskan
      return { previous };
    },
    onError: (_err, _missionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['missions'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  // Defensive check: beberapa versi react-query punya .isLoading, beberapa memakai status 'pending'
  const maybeIsLoading = (mutation as any).isLoading;
  const isVerifying: boolean =
    typeof maybeIsLoading === 'boolean' ? maybeIsLoading : mutation.status === 'pending';

  return {
    ...missionsQuery,
    completeMission: (id: string | number) => mutation.mutate(String(id)),
    isVerifying,
  };
}
