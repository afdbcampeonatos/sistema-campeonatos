"use client";

import { useMatchStore } from "@/lib/stores/match-store";
import Image from "next/image";

export function TeamSelector() {
  const match = useMatchStore((state) => state.match);
  const selectTeam = useMatchStore((state) => state.selectTeam);
  const openModal = useMatchStore((state) => state.openModal);
  const closeModal = useMatchStore((state) => state.closeModal);
  const pendingEventType = useMatchStore((state) => state.pendingEventType);

  if (!match) return null;

  const handleSelectTeam = (teamId: string) => {
    selectTeam(teamId);
    openModal("playerSelector", pendingEventType ?? undefined);
  };

  const handleClose = () => {
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="w-full max-w-lg bg-gray-800 rounded-t-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Selecione o Time</h2>
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

        {/* Team Options */}
        <div className="p-4 space-y-3">
          {/* Home Team */}
          <button
            onClick={() => handleSelectTeam(match.homeTeamId)}
            className="w-full flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors min-h-[72px]"
          >
            <div className="w-14 h-14 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {match.homeTeam.shieldUrl ? (
                <Image
                  width={48}
                  height={48}
                  src={match.homeTeam.shieldUrl}
                  alt={match.homeTeam.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-gray-400">
                  {match.homeTeam.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">{match.homeTeam.name}</p>
              <p className="text-sm text-gray-400">Casa</p>
            </div>
          </button>

          {/* Away Team */}
          <button
            onClick={() => handleSelectTeam(match.awayTeamId)}
            className="w-full flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors min-h-[72px]"
          >
            <div className="w-14 h-14 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {match.awayTeam.shieldUrl ? (
                <Image
                  width={48}
                  height={48}
                  src={match.awayTeam.shieldUrl}
                  alt={match.awayTeam.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-gray-400">
                  {match.awayTeam.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">{match.awayTeam.name}</p>
              <p className="text-sm text-gray-400">Visitante</p>
            </div>
          </button>
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-8" />
      </div>
    </div>
  );
}
