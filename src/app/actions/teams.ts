"use server";

import {
  isRegistrationOpen,
  updateChampionshipStatuses,
} from "@/lib/championship-status";
import { validateCPF } from "@/lib/masks";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export interface PlayerData {
  name: string;
  rg: string;
  photoFile?: File | Blob;
}

export interface CreateTeamResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
  };
}

export async function createTeam(
  championshipId: string,
  formData: FormData
): Promise<CreateTeamResult> {
  try {
    // Validar se o campeonato existe
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
    });

    if (!championship) {
      return {
        success: false,
        error: "Campeonato não encontrado",
      };
    }

    // Atualizar status dos campeonatos antes de verificar
    await updateChampionshipStatuses();

    // Buscar campeonato atualizado
    const updatedChampionship = await prisma.championship.findUnique({
      where: { id: championshipId },
    });

    if (!updatedChampionship) {
      return {
        success: false,
        error: "Campeonato não encontrado",
      };
    }

    // Verificar se as inscrições estão abertas usando a função utilitária
    if (!isRegistrationOpen(updatedChampionship)) {
      const now = new Date();
      if (updatedChampionship.status !== "OPEN") {
        return {
          success: false,
          error: "Este campeonato não está aceitando inscrições no momento",
        };
      }
      if (
        updatedChampionship.registrationStart &&
        now < updatedChampionship.registrationStart
      ) {
        return {
          success: false,
          error: `As inscrições começam em ${new Date(
            updatedChampionship.registrationStart
          ).toLocaleDateString("pt-BR")}`,
        };
      }
      if (
        updatedChampionship.registrationEnd &&
        now > updatedChampionship.registrationEnd
      ) {
        return {
          success: false,
          error: "As inscrições já foram encerradas",
        };
      }
      return {
        success: false,
        error: "As inscrições não estão abertas no momento",
      };
    }

    // Extrair dados do formulário
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const responsibleName = formData.get("responsibleName") as string;
    const responsibleCpf = formData.get("responsibleCpf") as string;
    const phone = formData.get("phone") as string;
    const shieldFile = formData.get("shield") as File | null;

    // Validação
    if (!name || !category || !responsibleName || !responsibleCpf || !phone) {
      return {
        success: false,
        error: "Todos os campos obrigatórios devem ser preenchidos",
      };
    }

    // Validar CPF (deve ter 11 dígitos e ser válido)
    const cleanCPF = responsibleCpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) {
      return {
        success: false,
        error: "CPF inválido. Deve conter 11 dígitos.",
      };
    }

    // Validar dígitos verificadores do CPF
    if (!validateCPF(responsibleCpf)) {
      return {
        success: false,
        error: "CPF inválido. Verifique os dígitos informados.",
      };
    }

    // Upload do escudo (se fornecido)
    let shieldUrl: string | null = null;
    if (shieldFile && shieldFile.size > 0) {
      try {
        console.log("[createTeam] Fazendo upload do escudo:", {
          fileName: shieldFile.name,
          fileSize: shieldFile.size,
          fileType: shieldFile.type,
        });
        shieldUrl = await uploadImage(shieldFile, "shields");
        console.log("[createTeam] Escudo enviado com sucesso:", shieldUrl);
      } catch (error) {
        console.error("Erro ao fazer upload do escudo:", error);
        return {
          success: false,
          error: `Erro ao fazer upload do escudo: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }. Verifique as configurações do Supabase.`,
        };
      }
    }

    // Criar time
    const team = await prisma.team.create({
      data: {
        championshipId,
        name: name.trim(),
        category: category.trim(),
        responsibleName: responsibleName.trim(),
        responsibleCpf: cleanCPF,
        phone: phone.replace(/\D/g, ""), // Remove máscara do telefone
        shieldUrl,
        status: "PENDING",
      },
    });

    revalidatePath(`/campeonatos/${championship.slug}`);

    return {
      success: true,
      data: {
        id: team.id,
        name: team.name,
      },
    };
  } catch (error: unknown) {
    console.error("Erro ao criar time:", error);
    return {
      success: false,
      error: "Erro ao criar time. Tente novamente.",
    };
  }
}

export interface UpdateTeamStatusResult {
  success: boolean;
  error?: string;
}

export async function updateTeamStatus(
  teamId: string,
  status: string
): Promise<UpdateTeamStatusResult> {
  try {
    // Validar status
    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return {
        success: false,
        error: "Status inválido",
      };
    }

    // Buscar time para obter o championshipId
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        championshipId: true,
        championship: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    if (!team) {
      return {
        success: false,
        error: "Time não encontrado",
      };
    }

    // Atualizar status
    await prisma.team.update({
      where: { id: teamId },
      data: { status },
    });

    revalidatePath(`/campeonatos/${team.championship.slug}`);

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("Erro ao atualizar status do time:", error);
    return {
      success: false,
      error: "Erro ao atualizar status. Tente novamente.",
    };
  }
}
