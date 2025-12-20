"use client";

import { MatchEventType, type PlayerInfo } from "@/core/domain/match";
import { useCreateEvent } from "@/lib/queries/match-queries";
import { useMatchStore } from "@/lib/stores/match-store";
import Image from "next/image";
import { useState } from "react";

export function PlayerSelector() {
  const match = useMatchStore((state) => state.match);
  const selectedTeamId = useMatchStore((state) => state.selectedTeamId);
  const pendingEventType = useMatchStore((state) => state.pendingEventType);
  const closeModal = useMatchStore((state) => state.closeModal);
  const displayMinute = useMatchStore((state) => state.displayMinute);

  const createEventMutation = useCreateEvent();

  // For substitutions, we need to track both player out and player in
  const [substitutionStep, setSubstitutionStep] = useState<"out" | "in">("out");
  const [playerOutId, setPlayerOutId] = useState<string | null>(null);

  if (!match || !selectedTeamId || !pendingEventType) return null;

  const team =
    selectedTeamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
  const players = team.players;

  const handleSelectPlayer = async (player: PlayerInfo) => {
    if (pendingEventType === MatchEventType.SUBSTITUTION) {
      if (substitutionStep === "out") {
        setPlayerOutId(player.id);
        setSubstitutionStep("in");
        return;
      }

      // Substitution: player in selected
      await createEventMutation.mutateAsync({
        matchId: match.id,
        type: pendingEventType,
        minute: displayMinute,
        half: match.currentHalf || 1,
        teamId: selectedTeamId,
        playerOutId: playerOutId!,
        playerInId: player.id,
      });
    } else {
      // Regular event
      await createEventMutation.mutateAsync({
        matchId: match.id,
        type: pendingEventType,
        minute: displayMinute,
        half: match.currentHalf || 1,
        teamId: selectedTeamId,
        playerId: player.id,
      });
    }

    closeModal();
  };

  const handleSkipPlayer = async () => {
    // Allow events without player selection (e.g., team foul)
    await createEventMutation.mutateAsync({
      matchId: match.id,
      type: pendingEventType,
      minute: displayMinute,
      half: match.currentHalf || 1,
      teamId: selectedTeamId,
    });

    closeModal();
  };

  const handleClose = () => {
    setSubstitutionStep("out");
    setPlayerOutId(null);
    closeModal();
  };

  const getTitle = () => {
    if (pendingEventType === MatchEventType.SUBSTITUTION) {
      return substitutionStep === "out"
        ? "Jogador que SAI"
        : "Jogador que ENTRA";
    }
    return "Selecione o Jogador";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="w-full max-w-lg bg-gray-800 rounded-t-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">{getTitle()}</h2>
            <p className="text-sm text-gray-400">{team.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {players.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum jogador cadastrado
            </p>
          ) : (
            players.map((player) => (
              <button
                key={player.id}
                onClick={() => handleSelectPlayer(player)}
                disabled={createEventMutation.isPending}
                className="w-full flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors min-h-[64px] disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                  {player.photoUrl ? (
                    <Image
                      width={48}
                      height={48}
                      src={player.photoUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {player.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-white">{player.name}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Skip Option (for events that don't require player) */}
        {pendingEventType !== MatchEventType.SUBSTITUTION && (
          <div className="px-4 pb-4 shrink-0">
            <button
              onClick={handleSkipPlayer}
              disabled={createEventMutation.isPending}
              className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Registrar sem jogador
            </button>
          </div>
        )}

        {/* Safe area padding for mobile */}
        <div className="h-8 shrink-0" />
      </div>
    </div>
  );
}
