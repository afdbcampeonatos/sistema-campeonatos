'use client';

import { useMatchStore } from '@/lib/stores/match-store';
import { MatchEventType, isMatchActive } from '@/core/domain/match';

export function EventButtons() {
  const match = useMatchStore((state) => state.match);
  const openModal = useMatchStore((state) => state.openModal);

  if (!match) return null;

  const isActive = isMatchActive(match.status);

  const handleEventClick = (eventType: MatchEventType) => {
    if (!isActive) return;
    openModal('teamSelector', eventType);
  };

  const buttonBase =
    'flex flex-col items-center justify-center p-4 rounded-xl font-semibold transition-all min-h-[80px] active:scale-95';

  const buttonEnabled = 'cursor-pointer';
  const buttonDisabled = 'opacity-50 cursor-not-allowed';

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Goal Button */}
      <button
        onClick={() => handleEventClick(MatchEventType.GOAL)}
        disabled={!isActive}
        className={`${buttonBase} bg-emerald-600 hover:bg-emerald-700 text-white ${
          isActive ? buttonEnabled : buttonDisabled
        }`}
      >
        <span className="text-3xl mb-1">⚽</span>
        <span className="text-sm">Gol</span>
      </button>

      {/* Yellow Card Button */}
      <button
        onClick={() => handleEventClick(MatchEventType.YELLOW_CARD)}
        disabled={!isActive}
        className={`${buttonBase} bg-yellow-500 hover:bg-yellow-600 text-black ${
          isActive ? buttonEnabled : buttonDisabled
        }`}
      >
        <span className="text-3xl mb-1">🟨</span>
        <span className="text-sm">Amarelo</span>
      </button>

      {/* Red Card Button */}
      <button
        onClick={() => handleEventClick(MatchEventType.RED_CARD)}
        disabled={!isActive}
        className={`${buttonBase} bg-red-600 hover:bg-red-700 text-white ${
          isActive ? buttonEnabled : buttonDisabled
        }`}
      >
        <span className="text-3xl mb-1">🟥</span>
        <span className="text-sm">Vermelho</span>
      </button>

      {/* Substitution Button */}
      <button
        onClick={() => handleEventClick(MatchEventType.SUBSTITUTION)}
        disabled={!isActive}
        className={`${buttonBase} bg-blue-600 hover:bg-blue-700 text-white ${
          isActive ? buttonEnabled : buttonDisabled
        }`}
      >
        <span className="text-3xl mb-1">🔄</span>
        <span className="text-sm">Substituicao</span>
      </button>

      {/* Own Goal Button */}
      <button
        onClick={() => handleEventClick(MatchEventType.OWN_GOAL)}
        disabled={!isActive}
        className={`${buttonBase} bg-gray-600 hover:bg-gray-700 text-white ${
          isActive ? buttonEnabled : buttonDisabled
        }`}
      >
        <span className="text-3xl mb-1">🔴⚽</span>
        <span className="text-sm">Gol Contra</span>
      </button>

      {/* Foul Button */}
      <button
        onClick={() => handleEventClick(MatchEventType.FOUL)}
        disabled={!isActive}
        className={`${buttonBase} bg-orange-600 hover:bg-orange-700 text-white ${
          isActive ? buttonEnabled : buttonDisabled
        }`}
      >
        <span className="text-3xl mb-1">⚠️</span>
        <span className="text-sm">Falta</span>
      </button>
    </div>
  );
}
