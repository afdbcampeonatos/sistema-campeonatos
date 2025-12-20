"use client";

import { MatchStatus } from "@/core/domain/match";
import { useUpdateMatchStatus } from "@/lib/queries/match-queries";
import { useMatchStore } from "@/lib/stores/match-store";

export function MatchControls() {
  const match = useMatchStore((state) => state.match);
  const timerRunning = useMatchStore((state) => state.timerRunning);
  const startTimer = useMatchStore((state) => state.startTimer);
  const pauseTimer = useMatchStore((state) => state.pauseTimer);
  const displayMinute = useMatchStore((state) => state.displayMinute);

  const updateStatusMutation = useUpdateMatchStatus();

  if (!match) return null;

  const handleStartMatch = () => {
    updateStatusMutation.mutate({
      matchId: match.id,
      status: MatchStatus.FIRST_HALF,
      currentHalf: 1,
      currentMinute: 0,
    });
    startTimer();
  };

  const handleEndFirstHalf = () => {
    updateStatusMutation.mutate({
      matchId: match.id,
      status: MatchStatus.HALFTIME,
      currentMinute: displayMinute,
    });
    pauseTimer();
  };

  const handleStartSecondHalf = () => {
    updateStatusMutation.mutate({
      matchId: match.id,
      status: MatchStatus.SECOND_HALF,
      currentHalf: 2,
      currentMinute: 45,
    });
    startTimer();
  };

  const handleEndMatch = () => {
    updateStatusMutation.mutate({
      matchId: match.id,
      status: MatchStatus.FINISHED,
      currentMinute: displayMinute,
    });
    pauseTimer();
  };

  const handleToggleTimer = () => {
    if (timerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const buttonBase =
    "w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all active:scale-98 min-h-[56px]";

  return (
    <div className="space-y-3">
      {/* Start Match - Only show when scheduled */}
      {match.status === MatchStatus.SCHEDULED && (
        <button
          onClick={handleStartMatch}
          disabled={updateStatusMutation.isPending}
          className={`${buttonBase} bg-emerald-600 hover:bg-emerald-700 text-white`}
        >
          {updateStatusMutation.isPending ? "Iniciando..." : "Iniciar Partida"}
        </button>
      )}

      {/* First Half Controls */}
      {match.status === MatchStatus.FIRST_HALF && (
        <div className="flex gap-3">
          <button
            onClick={handleToggleTimer}
            className={`${buttonBase} flex-1 ${
              timerRunning
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            } text-white`}
          >
            {timerRunning ? "Pausar" : "Continuar"}
          </button>
          <button
            onClick={handleEndFirstHalf}
            disabled={updateStatusMutation.isPending}
            className={`${buttonBase} flex-1 bg-gray-600 hover:bg-gray-700 text-white`}
          >
            Fim 1o Tempo
          </button>
        </div>
      )}

      {/* Halftime Controls */}
      {match.status === MatchStatus.HALFTIME && (
        <button
          onClick={handleStartSecondHalf}
          disabled={updateStatusMutation.isPending}
          className={`${buttonBase} bg-emerald-600 hover:bg-emerald-700 text-white`}
        >
          {updateStatusMutation.isPending ? "Iniciando..." : "Iniciar 2o Tempo"}
        </button>
      )}

      {/* Second Half Controls */}
      {match.status === MatchStatus.SECOND_HALF && (
        <div className="flex gap-3">
          <button
            onClick={handleToggleTimer}
            className={`${buttonBase} flex-1 ${
              timerRunning
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            } text-white`}
          >
            {timerRunning ? "Pausar" : "Continuar"}
          </button>
          <button
            onClick={handleEndMatch}
            disabled={updateStatusMutation.isPending}
            className={`${buttonBase} flex-1 bg-red-600 hover:bg-red-700 text-white`}
          >
            Encerrar Partida
          </button>
        </div>
      )}

      {/* Finished State */}
      {match.status === MatchStatus.FINISHED && (
        <div className="text-center py-4 bg-gray-800 rounded-xl">
          <span className="text-gray-400 text-lg">Partida Encerrada</span>
        </div>
      )}
    </div>
  );
}
