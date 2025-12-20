'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Match, CreateMatchEventInput, MatchStatus } from '@/core/domain/match';
import {
  createMatchEvent,
  updateMatchStatus,
  deleteMatchEvent,
} from '@/lib/actions/match-events';
import { useMatchStore } from '@/lib/stores/match-store';

// ============================================
// QUERY KEYS
// ============================================

export const matchKeys = {
  all: ['matches'] as const,
  detail: (id: string) => ['matches', id] as const,
  events: (matchId: string) => ['matches', matchId, 'events'] as const,
};

// ============================================
// FETCH FUNCTION
// ============================================

async function fetchMatch(matchId: string): Promise<Match> {
  const response = await fetch(`/api/matches/${matchId}`);
  if (!response.ok) {
    throw new Error('Falha ao carregar partida');
  }
  return response.json();
}

// ============================================
// HOOKS
// ============================================

export function useMatch(matchId: string) {
  const setMatch = useMatchStore((state) => state.setMatch);
  const setLoading = useMatchStore((state) => state.setLoading);
  const setError = useMatchStore((state) => state.setError);

  return useQuery({
    queryKey: matchKeys.detail(matchId),
    queryFn: () => fetchMatch(matchId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const store = useMatchStore.getState();

  return useMutation({
    mutationFn: async (input: CreateMatchEventInput) => {
      // Add to pending (optimistic)
      const tempId = store.addPendingEvent(input);
      store.markEventSyncing(tempId);

      const result = await createMatchEvent(input);

      if (!result.success) {
        store.markEventError(tempId, result.error ?? 'Erro desconhecido');
        throw new Error(result.error);
      }

      return { tempId, result };
    },
    onSuccess: ({ tempId }, input) => {
      store.removePendingEvent(tempId);
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(input.matchId) });
    },
    onError: (error) => {
      console.error('Event creation failed:', error);
    },
  });
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient();
  const store = useMatchStore.getState();

  return useMutation({
    mutationFn: async (input: {
      matchId: string;
      status: MatchStatus;
      currentMinute?: number;
      currentHalf?: number;
    }) => {
      const result = await updateMatchStatus(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result, matchId: input.matchId };
    },
    onSuccess: (data, input) => {
      // Optimistically update status in store
      store.updateMatchStatus(input.status, input.currentHalf, input.currentMinute);
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(input.matchId) });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, matchId }: { eventId: string; matchId: string }) => {
      const result = await deleteMatchEvent(eventId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { matchId };
    },
    onSuccess: ({ matchId }) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    },
  });
}
