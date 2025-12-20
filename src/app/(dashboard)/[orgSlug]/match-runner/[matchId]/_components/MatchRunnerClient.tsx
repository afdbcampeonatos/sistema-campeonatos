'use client';

import { useEffect } from 'react';
import type { Match } from '@/core/domain/match';
import { useMatchStore } from '@/lib/stores/match-store';
import { Scoreboard } from './Scoreboard';
import { EventButtons } from './EventButtons';
import { MatchControls } from './MatchControls';
import { EventLog } from './EventLog';
import { TeamSelector } from './TeamSelector';
import { PlayerSelector } from './PlayerSelector';

interface MatchRunnerClientProps {
  initialMatch: Match;
}

export function MatchRunnerClient({ initialMatch }: MatchRunnerClientProps) {
  const setMatch = useMatchStore((state) => state.setMatch);
  const activeModal = useMatchStore((state) => state.activeModal);
  const match = useMatchStore((state) => state.match);
  const isLoading = useMatchStore((state) => state.isLoading);
  const error = useMatchStore((state) => state.error);

  // Hydrate store with server data on mount
  useEffect(() => {
    setMatch(initialMatch);
  }, [initialMatch, setMatch]);

  if (isLoading && !match) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando partida...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Partida nao encontrada</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with match info */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="text-center text-sm text-gray-400">Match Runner</div>
      </header>

      {/* Main content */}
      <main className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Scoreboard */}
        <Scoreboard />

        {/* Match Controls */}
        <MatchControls />

        {/* Event Buttons */}
        <EventButtons />

        {/* Event Log */}
        <EventLog />
      </main>

      {/* Modals */}
      {activeModal === 'teamSelector' && <TeamSelector />}
      {activeModal === 'playerSelector' && <PlayerSelector />}
    </div>
  );
}
