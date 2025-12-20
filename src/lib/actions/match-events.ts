'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  MatchEventType,
  MatchStatus,
  calculateScoreFromEvents,
  type MatchEvent,
} from '@/core/domain/match';

// ============================================
// ZOD SCHEMAS
// ============================================

const CreateEventSchema = z.object({
  matchId: z.string().uuid(),
  type: z.enum([
    'GOAL',
    'OWN_GOAL',
    'YELLOW_CARD',
    'RED_CARD',
    'SUBSTITUTION',
    'FOUL',
    'MATCH_START',
    'HALF_END',
    'HALF_START',
    'MATCH_END',
  ]),
  minute: z.number().int().min(0).max(120),
  half: z.number().int().min(1).max(2),
  teamId: z.string().uuid(),
  playerId: z.string().uuid().optional(),
  playerInId: z.string().uuid().optional(),
  playerOutId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const UpdateMatchStatusSchema = z.object({
  matchId: z.string().uuid(),
  status: z.enum([
    'SCHEDULED',
    'FIRST_HALF',
    'HALFTIME',
    'SECOND_HALF',
    'FINISHED',
    'CANCELLED',
    'PAUSED',
  ]),
  currentMinute: z.number().int().min(0).optional(),
  currentHalf: z.number().int().min(0).max(2).optional(),
});

// ============================================
// RESULT TYPES
// ============================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// SERVER ACTIONS
// ============================================

export async function createMatchEvent(
  input: z.infer<typeof CreateEventSchema>
): Promise<ActionResult<{ eventId: string; newScore: { home: number; away: number } }>> {
  try {
    // Validate input
    const validated = CreateEventSchema.parse(input);

    // Verify match exists and is active
    const match = await prisma.match.findUnique({
      where: { id: validated.matchId },
      include: { events: true },
    });

    if (!match) {
      return { success: false, error: 'Partida não encontrada' };
    }

    if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
      return { success: false, error: 'Partida já foi finalizada' };
    }

    // Create the event
    const event = await prisma.matchEvent.create({
      data: {
        matchId: validated.matchId,
        type: validated.type,
        minute: validated.minute,
        half: validated.half,
        teamId: validated.teamId,
        playerId: validated.playerId,
        playerInId: validated.playerInId,
        playerOutId: validated.playerOutId,
        metadata: validated.metadata ? JSON.parse(JSON.stringify(validated.metadata)) : undefined,
      },
    });

    // Recalculate score from all events (including the new one)
    const allEvents = [...match.events, event];
    const newScore = calculateScoreFromEvents(
      allEvents.map((e) => ({
        ...e,
        type: e.type as MatchEventType,
        metadata: e.metadata as Record<string, unknown> | null,
      })),
      match.homeTeamId
    );

    // Update denormalized score on match
    await prisma.match.update({
      where: { id: validated.matchId },
      data: {
        homeScore: newScore.home,
        awayScore: newScore.away,
        currentMinute: validated.minute,
      },
    });

    // Revalidate paths
    revalidatePath(`/[orgSlug]/match-runner/${validated.matchId}`, 'page');

    return {
      success: true,
      data: {
        eventId: event.id,
        newScore,
      },
    };
  } catch (error) {
    console.error('Error creating match event:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Dados inválidos: ' + error.issues[0]?.message };
    }
    return { success: false, error: 'Erro ao registrar evento' };
  }
}

export async function updateMatchStatus(
  input: z.infer<typeof UpdateMatchStatusSchema>
): Promise<ActionResult<{ status: MatchStatus }>> {
  try {
    const validated = UpdateMatchStatusSchema.parse(input);

    const match = await prisma.match.findUnique({
      where: { id: validated.matchId },
    });

    if (!match) {
      return { success: false, error: 'Partida não encontrada' };
    }

    const updateData: Record<string, unknown> = {
      status: validated.status,
    };

    // Handle status-specific updates
    if (validated.status === 'FIRST_HALF') {
      updateData.startedAt = new Date();
      updateData.currentHalf = 1;
      updateData.currentMinute = 0;
    } else if (validated.status === 'HALFTIME') {
      updateData.currentHalf = 1;
    } else if (validated.status === 'SECOND_HALF') {
      updateData.currentHalf = 2;
      updateData.currentMinute = 45;
    } else if (validated.status === 'FINISHED') {
      updateData.finishedAt = new Date();
    }

    if (validated.currentMinute !== undefined) {
      updateData.currentMinute = validated.currentMinute;
    }
    if (validated.currentHalf !== undefined) {
      updateData.currentHalf = validated.currentHalf;
    }

    await prisma.match.update({
      where: { id: validated.matchId },
      data: updateData,
    });

    // Create a system event for status changes
    const eventTypeMap: Partial<Record<MatchStatus, MatchEventType>> = {
      FIRST_HALF: MatchEventType.MATCH_START,
      HALFTIME: MatchEventType.HALF_END,
      SECOND_HALF: MatchEventType.HALF_START,
      FINISHED: MatchEventType.MATCH_END,
    };

    const eventType = eventTypeMap[validated.status as MatchStatus];
    if (eventType) {
      await prisma.matchEvent.create({
        data: {
          matchId: validated.matchId,
          type: eventType,
          minute: (validated.currentMinute ?? match.currentMinute) || 0,
          half: (validated.currentHalf ?? match.currentHalf) || 1,
          teamId: match.homeTeamId, // System events attributed to home team
        },
      });
    }

    revalidatePath(`/[orgSlug]/match-runner/${validated.matchId}`, 'page');

    return {
      success: true,
      data: { status: validated.status as MatchStatus },
    };
  } catch (error) {
    console.error('Error updating match status:', error);
    return { success: false, error: 'Erro ao atualizar status da partida' };
  }
}

export async function deleteMatchEvent(eventId: string): Promise<ActionResult> {
  try {
    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
      include: { match: { include: { events: true } } },
    });

    if (!event) {
      return { success: false, error: 'Evento não encontrado' };
    }

    // Delete the event
    await prisma.matchEvent.delete({
      where: { id: eventId },
    });

    // Recalculate score without this event
    const remainingEvents = event.match.events.filter((e) => e.id !== eventId);
    const newScore = calculateScoreFromEvents(
      remainingEvents.map((e) => ({
        ...e,
        type: e.type as MatchEventType,
        metadata: e.metadata as Record<string, unknown> | null,
      })),
      event.match.homeTeamId
    );

    await prisma.match.update({
      where: { id: event.matchId },
      data: {
        homeScore: newScore.home,
        awayScore: newScore.away,
      },
    });

    revalidatePath(`/[orgSlug]/match-runner/${event.matchId}`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Error deleting match event:', error);
    return { success: false, error: 'Erro ao remover evento' };
  }
}

export async function getMatch(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          include: {
            players: {
              select: { id: true, name: true, photoUrl: true },
            },
          },
        },
        awayTeam: {
          include: {
            players: {
              select: { id: true, name: true, photoUrl: true },
            },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          include: {
            player: { select: { id: true, name: true, photoUrl: true } },
            team: { select: { id: true, name: true, shieldUrl: true } },
            playerIn: { select: { id: true, name: true, photoUrl: true } },
            playerOut: { select: { id: true, name: true, photoUrl: true } },
          },
        },
      },
    });

    return match;
  } catch (error) {
    console.error('Error fetching match:', error);
    return null;
  }
}
