// ============================================
// MATCH ENGINE - Domain Types
// Event Sourcing Lite Pattern
// ============================================

// Enums (mirroring Prisma for type safety)
export const MatchStatus = {
  SCHEDULED: 'SCHEDULED',
  FIRST_HALF: 'FIRST_HALF',
  HALFTIME: 'HALFTIME',
  SECOND_HALF: 'SECOND_HALF',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
  PAUSED: 'PAUSED',
} as const;

export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const MatchEventType = {
  GOAL: 'GOAL',
  OWN_GOAL: 'OWN_GOAL',
  YELLOW_CARD: 'YELLOW_CARD',
  RED_CARD: 'RED_CARD',
  SUBSTITUTION: 'SUBSTITUTION',
  FOUL: 'FOUL',
  MATCH_START: 'MATCH_START',
  HALF_END: 'HALF_END',
  HALF_START: 'HALF_START',
  MATCH_END: 'MATCH_END',
} as const;

export type MatchEventType = (typeof MatchEventType)[keyof typeof MatchEventType];

// ============================================
// DOMAIN INTERFACES
// ============================================

export interface TeamInfo {
  id: string;
  name: string;
  shieldUrl: string | null;
}

export interface PlayerInfo {
  id: string;
  name: string;
  photoUrl: string | null;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: MatchEventType;
  minute: number;
  half: number;
  playerId: string | null;
  teamId: string;
  playerInId: string | null;
  playerOutId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;

  // Populated relations
  player?: PlayerInfo | null;
  team?: TeamInfo;
  playerIn?: PlayerInfo | null;
  playerOut?: PlayerInfo | null;
}

export interface Match {
  id: string;
  championshipId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  currentHalf: number;
  currentMinute: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Populated relations
  homeTeam: TeamInfo & { players: PlayerInfo[] };
  awayTeam: TeamInfo & { players: PlayerInfo[] };
  events: MatchEvent[];
}

// ============================================
// INPUT TYPES (for actions/mutations)
// ============================================

export interface CreateMatchEventInput {
  matchId: string;
  type: MatchEventType;
  minute: number;
  half: number;
  teamId: string;
  playerId?: string;
  playerInId?: string;
  playerOutId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMatchStatusInput {
  matchId: string;
  status: MatchStatus;
  currentMinute?: number;
  currentHalf?: number;
}

// ============================================
// DERIVED STATE (computed from events)
// ============================================

export interface MatchScore {
  home: number;
  away: number;
}

export interface PlayerStats {
  goals: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  fouls: number;
}

// ============================================
// HELPER FUNCTIONS (pure logic, no side effects)
// ============================================

export function calculateScoreFromEvents(
  events: MatchEvent[],
  homeTeamId: string
): MatchScore {
  let home = 0;
  let away = 0;

  for (const event of events) {
    if (event.type === MatchEventType.GOAL) {
      if (event.teamId === homeTeamId) {
        home++;
      } else {
        away++;
      }
    }
    if (event.type === MatchEventType.OWN_GOAL) {
      // Own goal counts for the opposing team
      if (event.teamId === homeTeamId) {
        away++;
      } else {
        home++;
      }
    }
  }

  return { home, away };
}

export function getEventsByType(
  events: MatchEvent[],
  type: MatchEventType
): MatchEvent[] {
  return events.filter((e) => e.type === type);
}

export function getEventsByPlayer(
  events: MatchEvent[],
  playerId: string
): MatchEvent[] {
  return events.filter((e) => e.playerId === playerId);
}

export function isMatchActive(status: MatchStatus): boolean {
  return status === MatchStatus.FIRST_HALF || status === MatchStatus.SECOND_HALF;
}

export function isMatchFinished(status: MatchStatus): boolean {
  return status === MatchStatus.FINISHED || status === MatchStatus.CANCELLED;
}

export function getEventIcon(type: MatchEventType): string {
  const icons: Record<MatchEventType, string> = {
    GOAL: '⚽',
    OWN_GOAL: '🔴⚽',
    YELLOW_CARD: '🟨',
    RED_CARD: '🟥',
    SUBSTITUTION: '🔄',
    FOUL: '⚠️',
    MATCH_START: '▶️',
    HALF_END: '⏸️',
    HALF_START: '▶️',
    MATCH_END: '🏁',
  };
  return icons[type];
}

export function getEventLabel(type: MatchEventType): string {
  const labels: Record<MatchEventType, string> = {
    GOAL: 'Gol',
    OWN_GOAL: 'Gol Contra',
    YELLOW_CARD: 'Cartão Amarelo',
    RED_CARD: 'Cartão Vermelho',
    SUBSTITUTION: 'Substituição',
    FOUL: 'Falta',
    MATCH_START: 'Início da Partida',
    HALF_END: 'Fim do Tempo',
    HALF_START: 'Início do Tempo',
    MATCH_END: 'Fim da Partida',
  };
  return labels[type];
}
