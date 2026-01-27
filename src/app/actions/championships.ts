"use server";

import { updateChampionshipStatuses } from "@/lib/championship-status";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export interface CreateChampionshipResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
    slug: string;
  };
}

export async function createChampionship(
  formData: FormData
): Promise<CreateChampionshipResult> {
  try {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const registrationStart = formData.get("registrationStart") as
      | string
      | null;
    const registrationEnd = formData.get("registrationEnd") as string | null;
    const registrationFeeRaw = formData.get("registrationFee") as string | null;

    // Validação
    if (!name || !category) {
      return {
        success: false,
        error: "Nome e categoria são obrigatórios",
      };
    }

    // Validar datas e taxa
    let registrationStartDate: Date | null = null;
    let registrationEndDate: Date | null = null;
    let registrationFee: number | null = null;

    if (registrationStart) {
      registrationStartDate = new Date(registrationStart);
    }

    if (registrationEnd) {
      registrationEndDate = new Date(registrationEnd);
    }

    // Validar taxa de inscrição
    if (registrationFeeRaw) {
      const cleanFee = registrationFeeRaw
        .toString()
        .replace("R$", "")
        .replace(",", ".")
        .trim();
      registrationFee = parseFloat(cleanFee);
      if (isNaN(registrationFee) || registrationFee < 0) {
        return {
          success: false,
          error: "Taxa de inscrição inválida",
        };
      }
    }

    // Validar se data de fim é posterior à data de início
    if (
      registrationStartDate &&
      registrationEndDate &&
      registrationEndDate < registrationStartDate
    ) {
      return {
        success: false,
        error:
          "A data de fim das inscrições deve ser posterior à data de início",
      };
    }

    // Verificar se já existe um campeonato com o mesmo nome e categoria
    const existingChampionship = await prisma.championship.findFirst({
      where: {
        name: name.trim(),
        category: category.trim(),
      },
    });

    if (existingChampionship) {
      return {
        success: false,
        error: `Já existe um campeonato com o nome "${name.trim()}" na categoria "${category.trim()}".`,
      };
    }

    // Gerar slug incluindo nome e categoria
    const nameSlug = generateSlug(name.trim());
    const categorySlug = generateSlug(category.trim());
    const baseSlug = `${nameSlug}-${categorySlug}`;

    if (!baseSlug || !nameSlug || !categorySlug) {
      return {
        success: false,
        error:
          "Não foi possível gerar um slug válido a partir do nome e categoria",
      };
    }

    // Gerar slug único
    const uniqueSlug = await generateUniqueSlug(baseSlug, async (slug) => {
      const exists = await prisma.championship.findUnique({
        where: { slug },
      });
      return !!exists;
    });

    // Criar campeonato
    const championship = await prisma.championship.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        category: category.trim(),
        status: "OPEN",
        registrationStart: registrationStartDate,
        registrationEnd: registrationEndDate,
        registrationFee: registrationFee,
      },
    });

    // Revalidar o cache
    revalidatePath("/admin");
    revalidatePath("/campeonatos");

    return {
      success: true,
      data: {
        id: championship.id,
        name: championship.name,
        slug: championship.slug,
      },
    };
  } catch (error: unknown) {
    console.error("Erro ao criar campeonato:", error);

    // Tratar erro de slug duplicado (caso ainda ocorra)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "Já existe um campeonato com este nome. Tente um nome diferente.",
      };
    }

    return {
      success: false,
      error: "Erro ao criar campeonato. Tente novamente.",
    };
  }
}

export interface UpdateChampionshipResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
    slug: string;
  };
}

export async function updateChampionship(
  id: string,
  formData: FormData
): Promise<UpdateChampionshipResult> {
  try {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const status = formData.get("status") as string;
    const registrationStart = formData.get("registrationStart") as
      | string
      | null;
    const registrationEnd = formData.get("registrationEnd") as string | null;
    const registrationFeeRaw = formData.get("registrationFee") as string | null;

    // Validação
    if (!name || !category || !status) {
      return {
        success: false,
        error: "Nome, categoria e status são obrigatórios",
      };
    }

    // Validar datas e taxa
    let registrationStartDate: Date | null = null;
    let registrationEndDate: Date | null = null;
    let registrationFee: number | null = null;

    if (registrationStart) {
      registrationStartDate = new Date(registrationStart);
    }

    if (registrationEnd) {
      registrationEndDate = new Date(registrationEnd);
    }

    // Validar taxa de inscrição
    if (registrationFeeRaw) {
      const cleanFee = registrationFeeRaw
        .toString()
        .replace("R$", "")
        .replace(",", ".")
        .trim();
      registrationFee = parseFloat(cleanFee);
      if (isNaN(registrationFee) || registrationFee < 0) {
        return {
          success: false,
          error: "Taxa de inscrição inválida",
        };
      }
    }

    // Validar se data de fim é posterior à data de início
    if (
      registrationStartDate &&
      registrationEndDate &&
      registrationEndDate < registrationStartDate
    ) {
      return {
        success: false,
        error:
          "A data de fim das inscrições deve ser posterior à data de início",
      };
    }

    // Verificar se o campeonato existe
    const existingChampionship = await prisma.championship.findUnique({
      where: { id },
    });

    if (!existingChampionship) {
      return {
        success: false,
        error: "Campeonato não encontrado",
      };
    }

    // Gerar novo slug se o nome mudou
    let slug = existingChampionship.slug;
    if (name.trim() !== existingChampionship.name) {
      const baseSlug = generateSlug(name.trim());
      if (baseSlug) {
        slug = await generateUniqueSlug(baseSlug, async (newSlug) => {
          // Verificar se já existe outro campeonato com este slug
          const exists = await prisma.championship.findFirst({
            where: {
              slug: newSlug,
              id: { not: id },
            },
          });
          return !!exists;
        });
      }
    }

    // Determinar o status correto baseado nas datas
    let finalStatus = status.trim();
    const now = new Date();

    // Se há data de fim e já passou, forçar CLOSED (independente do que o usuário escolheu)
    if (registrationEndDate && now > registrationEndDate) {
      finalStatus = "CLOSED";
    }
    // Se não está expirado, verificar se pode ser aberto
    else {
      // Verificar se as datas permitem inscrições abertas
      const startDateValid =
        !registrationStartDate || now >= registrationStartDate;
      const endDateValid = !registrationEndDate || now <= registrationEndDate;

      // Se as datas são válidas e o campeonato estava fechado ou o usuário quer abrir
      if (startDateValid && endDateValid) {
        // Se estava CLOSED ou o usuário escolheu OPEN, abrir
        if (
          existingChampionship.status === "CLOSED" ||
          finalStatus === "OPEN"
        ) {
          finalStatus = "OPEN";
        }
      }
      // Se a data de início ainda não chegou, manter como está (ou DRAFT)
      else if (registrationStartDate && now < registrationStartDate) {
        // Se estava CLOSED mas a data de início ainda não chegou, pode manter como DRAFT ou OPEN
        // (mantém o status escolhido pelo usuário, exceto se for CLOSED - nesse caso vira DRAFT)
        if (finalStatus === "CLOSED") {
          finalStatus = "DRAFT";
        }
      }
    }

    // Atualizar campeonato
    const championship = await prisma.championship.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        category: category.trim(),
        status: finalStatus,
        registrationStart: registrationStartDate,
        registrationEnd: registrationEndDate,
        registrationFee: registrationFee,
      },
    });

    // Atualizar status de todos os campeonatos (garante que todos estejam corretos)
    await updateChampionshipStatuses();

    // Revalidar o cache
    revalidatePath("/admin");
    revalidatePath("/campeonatos");

    return {
      success: true,
      data: {
        id: championship.id,
        name: championship.name,
        slug: championship.slug,
      },
    };
  } catch (error: unknown) {
    console.error("Erro ao atualizar campeonato:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "Já existe um campeonato com este slug. Tente um nome diferente.",
      };
    }

    return {
      success: false,
      error: "Erro ao atualizar campeonato. Tente novamente.",
    };
  }
}

export interface DeleteChampionshipResult {
  success: boolean;
  error?: string;
  data?: {
    deletedPhotos: number;
    deletedTeams: number;
    deletedPlayers: number;
  };
}

export async function deleteChampionship(
  id: string
): Promise<DeleteChampionshipResult> {
  try {
    // Fetch championship with all teams and players (including photo URLs)
    const championship = await prisma.championship.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            players: {
              select: {
                id: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!championship) {
      return {
        success: false,
        error: "Campeonato não encontrado",
      };
    }

    let deletedPhotos = 0;
    let deletedPlayers = 0;

    // Delete all photos from storage before deleting from database
    for (const team of championship.teams) {
      // Delete player photos
      for (const player of team.players) {
        if (player.photoUrl) {
          try {
            await deleteImage(player.photoUrl);
            deletedPhotos++;
          } catch (error) {
            console.error(
              `Erro ao deletar foto do jogador ${player.id}:`,
              error
            );
            // Continue even if photo deletion fails
          }
        }
        deletedPlayers++;
      }

      // Delete team shield
      if (team.shieldUrl) {
        try {
          await deleteImage(team.shieldUrl);
          deletedPhotos++;
        } catch (error) {
          console.error(`Erro ao deletar escudo do time ${team.id}:`, error);
          // Continue even if photo deletion fails
        }
      }
    }

    // Delete championship (cascade will delete teams, players, matches, payments)
    await prisma.championship.delete({
      where: { id },
    });

    // Revalidate cache
    revalidatePath("/admin");
    revalidatePath("/campeonatos");

    return {
      success: true,
      data: {
        deletedPhotos,
        deletedTeams: championship.teams.length,
        deletedPlayers,
      },
    };
  } catch (error: unknown) {
    console.error("Erro ao deletar campeonato:", error);
    return {
      success: false,
      error: "Erro ao deletar campeonato. Tente novamente.",
    };
  }
}

export interface FinishChampionshipResult {
  success: boolean;
  error?: string;
  data?: {
    deletedPhotos: number;
  };
}

export async function finishChampionship(
  id: string
): Promise<FinishChampionshipResult> {
  try {
    // Fetch championship with all teams and players (including photo URLs)
    const championship = await prisma.championship.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            players: {
              select: {
                id: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!championship) {
      return {
        success: false,
        error: "Campeonato não encontrado",
      };
    }

    // Check if already finished
    if (championship.status === "FINISHED") {
      return {
        success: false,
        error: "Este campeonato já foi finalizado",
      };
    }

    let deletedPhotos = 0;

    // Delete all photos from storage (but keep database records for history)
    for (const team of championship.teams) {
      // Delete player photos
      for (const player of team.players) {
        if (player.photoUrl) {
          try {
            await deleteImage(player.photoUrl);
            deletedPhotos++;
            // Clear the photo URL in database
            await prisma.player.update({
              where: { id: player.id },
              data: { photoUrl: null },
            });
          } catch (error) {
            console.error(
              `Erro ao deletar foto do jogador ${player.id}:`,
              error
            );
            // Continue even if photo deletion fails
          }
        }
      }

      // Delete team shield
      if (team.shieldUrl) {
        try {
          await deleteImage(team.shieldUrl);
          deletedPhotos++;
          // Clear the shield URL in database
          await prisma.team.update({
            where: { id: team.id },
            data: { shieldUrl: null },
          });
        } catch (error) {
          console.error(`Erro ao deletar escudo do time ${team.id}:`, error);
          // Continue even if photo deletion fails
        }
      }
    }

    // Update championship status to FINISHED
    await prisma.championship.update({
      where: { id },
      data: { status: "FINISHED" },
    });

    // Revalidate cache
    revalidatePath("/admin");
    revalidatePath("/campeonatos");
    revalidatePath(`/campeonatos/${championship.slug}`);

    return {
      success: true,
      data: {
        deletedPhotos,
      },
    };
  } catch (error: unknown) {
    console.error("Erro ao finalizar campeonato:", error);
    return {
      success: false,
      error: "Erro ao finalizar campeonato. Tente novamente.",
    };
  }
}
