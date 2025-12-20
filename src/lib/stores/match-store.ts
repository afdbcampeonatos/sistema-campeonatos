'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Match,
  MatchEvent,
  CreateMatchEventInput,
  MatchEventType,
} from '@/core/domain/match';

// ============================================
// UI STATE TYPES
// ============================================

export type ActiveModal =
  | null
  | 'goal'
  | 'ownGoal'
  | 'yellowCard'
  | 'redCard'
  | 'substitution'
  | 'foul'
  | 'teamSelector'
  | 'playerSelector';

export interface PendingEvent {
  id: string; // Temporary ID for optimistic update
  input: CreateMatchEventInput;
  status: 'pending' | 'syncing' | 'error';
  errorMessage?: string;
}

// ============================================
// STORE STATE
// ============================================

interface MatchState {
  // Core match data (from server)
  match: Match | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  activeModal: ActiveModal;
  selectedTeamId: string | null;
  selectedPlayerId: string | null;
  pendingEventType: MatchEventType | null;

  // Timer state (local)
  timerRunning: boolean;
  displayMinute: number;

  // Optimistic updates queue
  pendingEvents: PendingEvent[];

  // Derived state (computed from match + pending events)
  optimisticHomeScore: number;
  optimisticAwayScore: number;
  optimisticEvents: MatchEvent[];
}

// ============================================
// STORE ACTIONS
// ============================================

interface MatchActions {
  // Data management
  setMatch: (match: Match) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // UI actions
  openModal: (modal: ActiveModal, eventType?: MatchEventType) => void;
  closeModal: () => void;
  selectTeam: (teamId: string | null) => void;
  selectPlayer: (playerId: string | null) => void;
  resetSelection: () => void;

  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  setDisplayMinute: (minute: number) => void;
  incrementMinute: () => void;

  // Optimistic event management
  addPendingEvent: (input: CreateMatchEventInput) => string;
  markEventSyncing: (tempId: string) => void;
  removePendingEvent: (tempId: string) => void;
  markEventError: (tempId: string, message: string) => void;

  // Event confirmed from server
  confirmEvent: (tempId: string, serverEvent: MatchEvent) => void;

  // Match status updates
  updateMatchStatus: (
    status: Match['status'],
    currentHalf?: number,
    currentMinute?: number
  ) => void;

  // Full reset
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: MatchState = {
  match: null,
  isLoading: true,
  error: null,
  activeModal: null,
  selectedTeamId: null,
  selectedPlayerId: null,
  pendingEventType: null,
  timerRunning: false,
  displayMinute: 0,
  pendingEvents: [],
  optimisticHomeScore: 0,
  optimisticAwayScore: 0,
  optimisticEvents: [],
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useMatchStore = create<MatchState & MatchActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setMatch: (match) => {
        set({
          match,
          optimisticHomeScore: match.homeScore,
          optimisticAwayScore: match.awayScore,
          optimisticEvents: match.events,
          displayMinute: match.currentMinute,
          error: null,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),

      openModal: (activeModal, eventType) =>
        set({
          activeModal,
          pendingEventType: eventType ?? null,
        }),

      closeModal: () =>
        set({
          activeModal: null,
          selectedTeamId: null,
          selectedPlayerId: null,
          pendingEventType: null,
        }),

      selectTeam: (selectedTeamId) => set({ selectedTeamId }),
      selectPlayer: (selectedPlayerId) => set({ selectedPlayerId }),

      resetSelection: () =>
        set({
          selectedTeamId: null,
          selectedPlayerId: null,
          pendingEventType: null,
        }),

      startTimer: () => set({ timerRunning: true }),
      pauseTimer: () => set({ timerRunning: false }),
      setDisplayMinute: (displayMinute) => set({ displayMinute }),
      incrementMinute: () =>
        set((state) => ({
          displayMinute: state.displayMinute + 1,
        })),

      addPendingEvent: (input) => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const pendingEvent: PendingEvent = {
          id: tempId,
          input,
          status: 'pending',
        };

        set((state) => {
          const newPendingEvents = [...state.pendingEvents, pendingEvent];

          // Recalculate optimistic score
          let homeAdd = 0;
          let awayAdd = 0;

          if (input.type === 'GOAL') {
            if (input.teamId === state.match?.homeTeamId) {
              homeAdd = 1;
            } else {
              awayAdd = 1;
            }
          }
          if (input.type === 'OWN_GOAL') {
            if (input.teamId === state.match?.homeTeamId) {
              awayAdd = 1;
            } else {
              homeAdd = 1;
            }
          }

          return {
            pendingEvents: newPendingEvents,
            optimisticHomeScore: state.optimisticHomeScore + homeAdd,
            optimisticAwayScore: state.optimisticAwayScore + awayAdd,
          };
        });

        return tempId;
      },

      markEventSyncing: (tempId) => {
        set((state) => ({
          pendingEvents: state.pendingEvents.map((e) =>
            e.id === tempId ? { ...e, status: 'syncing' as const } : e
          ),
        }));
      },

      removePendingEvent: (tempId) => {
        set((state) => ({
          pendingEvents: state.pendingEvents.filter((e) => e.id !== tempId),
        }));
      },

      markEventError: (tempId, message) => {
        set((state) => {
          // Rollback optimistic score
          const pendingEvent = state.pendingEvents.find((e) => e.id === tempId);
          let homeRollback = 0;
          let awayRollback = 0;

          if (pendingEvent) {
            const { input } = pendingEvent;
            if (input.type === 'GOAL') {
              if (input.teamId === state.match?.homeTeamId) {
                homeRollback = -1;
              } else {
                awayRollback = -1;
              }
            }
            if (input.type === 'OWN_GOAL') {
              if (input.teamId === state.match?.homeTeamId) {
                awayRollback = -1;
              } else {
                homeRollback = -1;
              }
            }
          }

          return {
            pendingEvents: state.pendingEvents.map((e) =>
              e.id === tempId
                ? { ...e, status: 'error' as const, errorMessage: message }
                : e
            ),
            optimisticHomeScore: state.optimisticHomeScore + homeRollback,
            optimisticAwayScore: state.optimisticAwayScore + awayRollback,
          };
        });
      },

      confirmEvent: (tempId, serverEvent) => {
        set((state) => {
          const newEvents = [serverEvent, ...state.optimisticEvents];
          return {
            pendingEvents: state.pendingEvents.filter((e) => e.id !== tempId),
            optimisticEvents: newEvents,
          };
        });
      },

      updateMatchStatus: (status, currentHalf, currentMinute) => {
        set((state) => {
          if (!state.match) return state;

          return {
            match: {
              ...state.match,
              status,
              currentHalf: currentHalf ?? state.match.currentHalf,
              currentMinute: currentMinute ?? state.match.currentMinute,
            },
            displayMinute: currentMinute ?? state.displayMinute,
          };
        });
      },

      reset: () => set(initialState),
    }),
    { name: 'match-store' }
  )
);
