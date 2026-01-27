"use server";

import {
  isRegistrationOpen,
  updateChampionshipStatuses,
} from "@/lib/championship-status";
import { createAsaasCustomer, createPixCharge, getPixQrCode } from "@/lib/asaas";
import { validateCPF } from "@/lib/masks";
import { prisma } from "@/lib/prisma";
import { uploadImage, deleteImage } from "@/lib/storage";
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
    paymentData?: {
      pixQrCode: string;
      pixQrCodeUrl: string;
      value: number;
    };
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
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const shieldFile = formData.get("shield") as File | null;

    // Validação
    if (
      !name ||
      !category ||
      !responsibleName ||
      !responsibleCpf ||
      !email ||
      !phone
    ) {
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
        shieldUrl = await uploadImage(shieldFile, "shields");
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
        email: email.trim(),
        phone: phone.replace(/\D/g, ""), // Remove máscara do telefone
        shieldUrl,
        status: "PENDING",
      },
    });

    // Processar pagamento se houver taxa
    // @ts-ignore - registrationFee pode não existir se a migration não rodou
    const registrationFee = updatedChampionship.registrationFee
      ? // @ts-ignore
        Number(updatedChampionship.registrationFee)
      : 0;

    if (registrationFee > 0) {
      try {
        // Criar cliente no Asaas
        const customer = await createAsaasCustomer({
          name: responsibleName.trim(),
          cpfCnpj: cleanCPF,
          email: email.trim(),
          phone: phone.replace(/\D/g, ""),
        });

        // Data de vencimento (24h a partir de agora)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        // Criar cobrança Pix
        const charge = await createPixCharge({
          customer: customer.id,
          value: registrationFee,
          dueDate: dueDate.toISOString().split("T")[0],
          description: `Inscrição Time ${name} - ${updatedChampionship.name}`,
          externalReference: team.id,
        });

        // Gerar QR Code Pix
        const qrCodeData = await getPixQrCode(charge.id);

        // Salvar dados do pagamento
        // @ts-ignore - Payment pode não existir se a migration não rodou
        await prisma.payment.create({
          data: {
            teamId: team.id,
            asaasPaymentId: charge.id,
            amount: registrationFee,
            status: "PENDING",
            pixQrCode: qrCodeData.payload,
            pixQrCodeUrl: qrCodeData.encodedImage, // Base64 da imagem
            invoiceUrl: charge.invoiceUrl,
          },
        });

        revalidatePath(`/campeonatos/${championship.slug}`);

        return {
          success: true,
          data: {
            id: team.id,
            name: team.name,
            paymentData: {
              pixQrCode: qrCodeData.payload,
              pixQrCodeUrl: `data:image/png;base64,${qrCodeData.encodedImage}`,
              value: registrationFee,
            },
          },
        };
      } catch (paymentError) {
        console.error("Erro ao processar pagamento:", paymentError);
        // Em caso de erro no pagamento, mas time criado com sucesso:
        // Idealmente, deveríamos permitir tentar pagar novamente depois.
        // Por enquanto, retornamos erro mas o time fica como PENDING.
        const errorMessage = paymentError instanceof Error
          ? paymentError.message
          : "Erro desconhecido";
        return {
          success: true, // Time criado
          error: `Time cadastrado, mas erro ao gerar pagamento: ${errorMessage}. Entre em contato com a organização.`,
          data: {
            id: team.id,
            name: team.name,
          },
        };
      }
    }

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
      error: `Erro ao criar time: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
    };
  }
}

export interface UpdateTeamStatusResult {
  success: boolean;
  error?: string;
}

export interface DeleteTeamResult {
  success: boolean;
  error?: string;
  data?: {
    deletedPhotos: number;
    deletedPlayers: number;
  };
}

export async function deleteTeam(teamId: string): Promise<DeleteTeamResult> {
  try {
    // Fetch team with all related data
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          select: {
            id: true,
            photoUrl: true,
          },
        },
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

    let deletedPhotos = 0;

    // Delete all player photos from storage
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
          // Continue with deletion even if photo fails
        }
      }
    }

    // Delete team shield from storage
    if (team.shieldUrl) {
      try {
        await deleteImage(team.shieldUrl);
        deletedPhotos++;
      } catch (error) {
        console.error(`Erro ao deletar escudo do time ${teamId}:`, error);
        // Continue with deletion even if photo fails
      }
    }

    // Delete team from database (cascade will delete players and payment)
    await prisma.team.delete({
      where: { id: teamId },
    });

    revalidatePath(`/campeonatos/${team.championship.slug}`);
    revalidatePath("/admin");

    return {
      success: true,
      data: {
        deletedPhotos,
        deletedPlayers: team.players.length,
      },
    };
  } catch (error: unknown) {
    console.error("Erro ao deletar time:", error);
    return {
      success: false,
      error: `Erro ao deletar time: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
    };
  }
}

export interface DeletePlayerResult {
  success: boolean;
  error?: string;
}

export async function deletePlayer(
  playerId: string
): Promise<DeletePlayerResult> {
  try {
    // Fetch player with photo URL and team info
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        team: {
          select: {
            championshipId: true,
            championship: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!player) {
      return {
        success: false,
        error: "Jogador não encontrado",
      };
    }

    // Delete player photo from storage if exists
    if (player.photoUrl) {
      try {
        await deleteImage(player.photoUrl);
      } catch (error) {
        console.error(`Erro ao deletar foto do jogador ${playerId}:`, error);
        // Continue with deletion even if photo fails
      }
    }

    // Delete player from database
    await prisma.player.delete({
      where: { id: playerId },
    });

    revalidatePath(`/campeonatos/${player.team.championship.slug}`);
    revalidatePath("/admin");

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("Erro ao deletar jogador:", error);
    return {
      success: false,
      error: `Erro ao deletar jogador: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
    };
  }
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
