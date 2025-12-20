"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================
// ZOD SCHEMAS
// ============================================

const CreateMatchSchema = z.object({
  championshipId: z.string().uuid(),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

const GenerateMatchesSchema = z.object({
  championshipId: z.string().uuid(),
  format: z.enum(["round-robin", "single-elimination", "group-stage"]),
  teamIds: z.array(z.string().uuid()).min(2),
  // Round Robin options
  roundRobinReturn: z.boolean().optional(),
  // Single Elimination options
  includeThirdPlace: z.boolean().optional(),
  // Group Stage options
  numberOfGroups: z.number().int().min(2).optional(),
  teamsPerGroup: z.number().int().min(2).optional(),
  // Scheduling options
  startDate: z.string().datetime().optional().nullable(),
  daysBetweenMatches: z.number().int().min(0).optional(),
});

const UpdateMatchSchema = z.object({
  matchId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional().nullable(),
  homeTeamId: z.string().uuid().optional(),
  awayTeamId: z.string().uuid().optional(),
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

export async function createMatch(
  input: z.infer<typeof CreateMatchSchema>
): Promise<ActionResult<{ matchId: string }>> {
  try {
    const validated = CreateMatchSchema.parse(input);

    // Validar que os times são diferentes
    if (validated.homeTeamId === validated.awayTeamId) {
      return { success: false, error: "Os times devem ser diferentes" };
    }

    // Verificar se os times pertencem ao campeonato
    const teams = await prisma.team.findMany({
      where: {
        id: { in: [validated.homeTeamId, validated.awayTeamId] },
        championshipId: validated.championshipId,
        status: "APPROVED",
      },
    });

    if (teams.length !== 2) {
      return {
        success: false,
        error: "Times não encontrados ou não aprovados no campeonato",
      };
    }

    // Verificar se já existe partida entre esses times no campeonato
    const existingMatch = await prisma.match.findFirst({
      where: {
        championshipId: validated.championshipId,
        OR: [
          {
            homeTeamId: validated.homeTeamId,
            awayTeamId: validated.awayTeamId,
          },
          {
            homeTeamId: validated.awayTeamId,
            awayTeamId: validated.homeTeamId,
          },
        ],
      },
    });

    if (existingMatch) {
      return {
        success: false,
        error: "Já existe uma partida entre esses times neste campeonato",
      };
    }

    // Criar partida
    const match = await prisma.match.create({
      data: {
        championshipId: validated.championshipId,
        homeTeamId: validated.homeTeamId,
        awayTeamId: validated.awayTeamId,
        scheduledAt: validated.scheduledAt
          ? new Date(validated.scheduledAt)
          : null,
      },
    });

    revalidatePath("/admin");
    revalidatePath(`/api/admin/campeonatos/${validated.championshipId}/teams`);

    return { success: true, data: { matchId: match.id } };
  } catch (error) {
    console.error("Error creating match:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos: " + error.issues[0]?.message,
      };
    }
    return { success: false, error: "Erro ao criar partida" };
  }
}

export async function generateMatches(
  input: z.infer<typeof GenerateMatchesSchema>
): Promise<ActionResult<{ matchesCreated: number }>> {
  try {
    const validated = GenerateMatchesSchema.parse(input);

    // Verificar que os times pertencem ao campeonato e estão aprovados
    const teams = await prisma.team.findMany({
      where: {
        id: { in: validated.teamIds },
        championshipId: validated.championshipId,
        status: "APPROVED",
      },
    });

    if (teams.length !== validated.teamIds.length) {
      return {
        success: false,
        error: "Alguns times não foram encontrados ou não estão aprovados",
      };
    }

    // Importar geradores
    const {
      generateRoundRobin,
      generateSingleElimination,
      generateGroupStage,
    } = await import("@/lib/utils/match-generators");

    let matchesToCreate: Array<{
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: Date | null;
    }> = [];

    // Gerar partidas baseado no formato
    switch (validated.format) {
      case "round-robin":
        matchesToCreate = generateRoundRobin(
          validated.teamIds,
          validated.roundRobinReturn || false
        );
        break;
      case "single-elimination":
        matchesToCreate = generateSingleElimination(
          validated.teamIds,
          validated.includeThirdPlace || false
        );
        break;
      case "group-stage":
        if (!validated.numberOfGroups || !validated.teamsPerGroup) {
          return {
            success: false,
            error: "Número de grupos e times por grupo são obrigatórios",
          };
        }
        matchesToCreate = generateGroupStage(
          validated.teamIds,
          validated.numberOfGroups,
          validated.teamsPerGroup
        );
        break;
    }

    // Aplicar agendamento se fornecido
    if (validated.startDate && matchesToCreate.length > 0) {
      const startDate = new Date(validated.startDate);
      const daysBetween = validated.daysBetweenMatches || 0;
      let currentDate = new Date(startDate);

      matchesToCreate = matchesToCreate.map((match, index) => {
        if (index > 0 && daysBetween > 0) {
          currentDate = new Date(
            currentDate.getTime() + daysBetween * 24 * 60 * 60 * 1000
          );
        }
        return {
          ...match,
          scheduledAt: index === 0 ? startDate : currentDate,
        };
      });
    }

    // Verificar partidas duplicadas existentes
    const existingMatches = await prisma.match.findMany({
      where: {
        championshipId: validated.championshipId,
      },
    });

    const matchesToCreateFiltered = matchesToCreate.filter((newMatch) => {
      return !existingMatches.some(
        (existing) =>
          (existing.homeTeamId === newMatch.homeTeamId &&
            existing.awayTeamId === newMatch.awayTeamId) ||
          (existing.homeTeamId === newMatch.awayTeamId &&
            existing.awayTeamId === newMatch.homeTeamId)
      );
    });

    if (matchesToCreateFiltered.length === 0) {
      return {
        success: false,
        error: "Todas as partidas já existem no campeonato",
      };
    }

    // Criar partidas
    await prisma.match.createMany({
      data: matchesToCreateFiltered.map((match) => ({
        championshipId: validated.championshipId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        scheduledAt: match.scheduledAt,
      })),
    });

    revalidatePath("/admin");

    return {
      success: true,
      data: { matchesCreated: matchesToCreateFiltered.length },
    };
  } catch (error) {
    console.error("Error generating matches:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Dados inválidos: " + error.issues[0]?.message,
      };
    }
    return { success: false, error: "Erro ao gerar partidas" };
  }
}

export async function updateMatch(
  input: z.infer<typeof UpdateMatchSchema>
): Promise<ActionResult> {
  try {
    const validated = UpdateMatchSchema.parse(input);

    const match = await prisma.match.findUnique({
      where: { id: validated.matchId },
    });

    if (!match) {
      return { success: false, error: "Partida não encontrada" };
    }

    // Não permitir editar partidas já iniciadas
    if (match.status !== "SCHEDULED") {
      return {
        success: false,
        error: "Não é possível editar partidas já iniciadas",
      };
    }

    const updateData: Record<string, unknown> = {};

    if (validated.scheduledAt !== undefined) {
      updateData.scheduledAt = validated.scheduledAt
        ? new Date(validated.scheduledAt)
        : null;
    }

    if (validated.homeTeamId) {
      updateData.homeTeamId = validated.homeTeamId;
    }

    if (validated.awayTeamId) {
      updateData.awayTeamId = validated.awayTeamId;
    }

    await prisma.match.update({
      where: { id: validated.matchId },
      data: updateData,
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/match-runner/${validated.matchId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating match:", error);
    return { success: false, error: "Erro ao atualizar partida" };
  }
}

export async function deleteMatch(matchId: string): Promise<ActionResult> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return { success: false, error: "Partida não encontrada" };
    }

    // Não permitir deletar partidas já iniciadas
    if (match.status !== "SCHEDULED") {
      return {
        success: false,
        error: "Não é possível deletar partidas já iniciadas",
      };
    }

    await prisma.match.delete({
      where: { id: matchId },
    });

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error deleting match:", error);
    return { success: false, error: "Erro ao deletar partida" };
  }
}
