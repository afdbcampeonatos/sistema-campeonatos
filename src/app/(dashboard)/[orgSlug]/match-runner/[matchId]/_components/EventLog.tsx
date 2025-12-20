'use client';

import { useMatchStore } from '@/lib/stores/match-store';
import { useDeleteEvent } from '@/lib/queries/match-queries';
import { getEventIcon, getEventLabel, MatchEventType } from '@/core/domain/match';

export function EventLog() {
  const match = useMatchStore((state) => state.match);
  const optimisticEvents = useMatchStore((state) => state.optimisticEvents);
  const pendingEvents = useMatchStore((state) => state.pendingEvents);

  const deleteEventMutation = useDeleteEvent();

  if (!match) return null;

  // Filter out system events (MATCH_START, etc.) for display
  const systemEventTypes: string[] = [
    MatchEventType.MATCH_START,
    MatchEventType.HALF_START,
    MatchEventType.HALF_END,
    MatchEventType.MATCH_END,
  ];
  const displayEvents = optimisticEvents.filter(
    (e) => !systemEventTypes.includes(e.type)
  );

  const handleDelete = (eventId: string) => {
    if (confirm('Deseja remover este evento?')) {
      deleteEventMutation.mutate({ eventId, matchId: match.id });
    }
  };

  if (displayEvents.length === 0 && pendingEvents.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-500">Nenhum evento registrado</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold text-gray-300">Eventos</h3>
      </div>

      <div className="divide-y divide-gray-700 max-h-[300px] overflow-y-auto">
        {/* Pending Events */}
        {pendingEvents.map((pending) => (
          <div
            key={pending.id}
            className={`px-4 py-3 flex items-center gap-3 ${
              pending.status === 'error' ? 'bg-red-900/20' : 'bg-emerald-900/20'
            }`}
          >
            <span className="text-2xl">{getEventIcon(pending.input.type)}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                {getEventLabel(pending.input.type)}
              </p>
              <p className="text-xs text-gray-500">
                {pending.status === 'pending' && 'Enviando...'}
                {pending.status === 'syncing' && 'Sincronizando...'}
                {pending.status === 'error' && pending.errorMessage}
              </p>
            </div>
            <span className="text-sm text-gray-500">{pending.input.minute}&apos;</span>
          </div>
        ))}

        {/* Confirmed Events */}
        {displayEvents.map((event) => (
          <div key={event.id} className="px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{getEventIcon(event.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300">{getEventLabel(event.type)}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {event.player && <span>{event.player.name}</span>}
                {event.team && <span>({event.team.name})</span>}
                {event.type === MatchEventType.SUBSTITUTION &&
                  event.playerOut &&
                  event.playerIn && (
                    <span>
                      {event.playerOut.name} → {event.playerIn.name}
                    </span>
                  )}
              </div>
            </div>
            <span className="text-sm text-gray-500 tabular-nums">
              {event.minute}&apos;
            </span>
            <button
              onClick={() => handleDelete(event.id)}
              disabled={deleteEventMutation.isPending}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              title="Remover evento"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
