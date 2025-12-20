'use client';

import { useEffect, useRef } from 'react';
import { useMatchStore } from '@/lib/stores/match-store';
import { MatchStatus as MatchStatusEnum } from '@/core/domain/match';

export function Scoreboard() {
  const match = useMatchStore((state) => state.match);
  const optimisticHomeScore = useMatchStore((state) => state.optimisticHomeScore);
  const optimisticAwayScore = useMatchStore((state) => state.optimisticAwayScore);
  const displayMinute = useMatchStore((state) => state.displayMinute);
  const timerRunning = useMatchStore((state) => state.timerRunning);
  const incrementMinute = useMatchStore((state) => state.incrementMinute);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic - increment minute every 60 seconds when running
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        incrementMinute();
      }, 60000); // 1 minute
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerRunning, incrementMinute]);

  if (!match) return null;

  const getStatusLabel = () => {
    switch (match.status) {
      case MatchStatusEnum.SCHEDULED:
        return 'Aguardando';
      case MatchStatusEnum.FIRST_HALF:
        return '1o Tempo';
      case MatchStatusEnum.HALFTIME:
        return 'Intervalo';
      case MatchStatusEnum.SECOND_HALF:
        return '2o Tempo';
      case MatchStatusEnum.FINISHED:
        return 'Encerrado';
      case MatchStatusEnum.CANCELLED:
        return 'Cancelado';
      case MatchStatusEnum.PAUSED:
        return 'Pausado';
      default:
        return '';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      {/* Status and Timer */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-emerald-400 uppercase tracking-wide">
          {getStatusLabel()}
        </span>
        <span className="text-2xl font-bold text-white tabular-nums">
          {displayMinute}&apos;
        </span>
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {match.homeTeam.shieldUrl ? (
              <img
                src={match.homeTeam.shieldUrl}
                alt={match.homeTeam.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-400">
                {match.homeTeam.name.charAt(0)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 truncate max-w-[100px] mx-auto">
            {match.homeTeam.name}
          </p>
        </div>

        {/* Score */}
        <div className="px-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold text-white tabular-nums">
              {optimisticHomeScore}
            </span>
            <span className="text-3xl text-gray-500">:</span>
            <span className="text-5xl font-bold text-white tabular-nums">
              {optimisticAwayScore}
            </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {match.awayTeam.shieldUrl ? (
              <img
                src={match.awayTeam.shieldUrl}
                alt={match.awayTeam.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-400">
                {match.awayTeam.name.charAt(0)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 truncate max-w-[100px] mx-auto">
            {match.awayTeam.name}
          </p>
        </div>
      </div>
    </div>
  );
}
