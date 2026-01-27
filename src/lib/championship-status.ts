/**
 * Utilitário para gerenciar o status dos campeonatos baseado nas datas de inscrição
 *
 * Status possíveis:
 * - DRAFT: Campeonato criado mas ainda não aberto
 * - OPEN: Inscrições abertas
 * - CLOSED: Inscrições encerradas (mas campeonato ainda em andamento)
 * - FINISHED: Campeonato finalizado (fotos deletadas, dados mantidos para histórico)
 */

import { prisma } from "./prisma";

/**
 * Verifica e atualiza o status dos campeonatos baseado nas datas de inscrição
 * - Se registrationEnd passou, muda status para CLOSED
 * - Se registrationStart ainda não chegou, mantém status (ou pode mudar para DRAFT)
 */
export async function updateChampionshipStatuses(): Promise<void> {
  try {
    const now = new Date();

    // Buscar todos os campeonatos com status OPEN que têm data de fim definida
    // Não incluir FINISHED - esse status é permanente
    const championshipsToClose = await prisma.championship.findMany({
      where: {
        status: "OPEN",
        registrationEnd: {
          not: null,
          lt: now, // Data de fim já passou
        },
      },
    });

    // Fechar campeonatos cuja data de inscrição expirou
    if (championshipsToClose.length > 0) {
      await prisma.championship.updateMany({
        where: {
          id: {
            in: championshipsToClose.map((c) => c.id),
          },
        },
        data: {
          status: "CLOSED",
        },
      });

    }

    // Reabrir campeonatos com status CLOSED que têm datas válidas
    // (por exemplo, quando um administrador atualiza a data de fim para uma data futura)
    // Primeiro, buscar todos os campeonatos fechados
    const allClosedChampionships = await prisma.championship.findMany({
      where: {
        status: "CLOSED",
      },
    });

    // Filtrar manualmente aqueles que podem ser reabertos
    const closedChampionshipsToReopen = allClosedChampionships.filter(
      (championship) => {
        // Se tem data de início e ainda não chegou, não pode abrir ainda
        if (championship.registrationStart) {
          const startDate = new Date(championship.registrationStart);
          if (now < startDate) {
            return false;
          }
        }

        // Se tem data de fim e ainda não passou, pode reabrir
        if (championship.registrationEnd) {
          const endDate = new Date(championship.registrationEnd);
          if (now > endDate) {
            return false; // Ainda expirado
          }
          return true; // Data de fim é futura, pode reabrir
        }

        // Sem data de fim, pode reabrir se a data de início já passou (ou não existe)
        return true;
      }
    );

    if (closedChampionshipsToReopen.length > 0) {
      await prisma.championship.updateMany({
        where: {
          id: {
            in: closedChampionshipsToReopen.map((c) => c.id),
          },
        },
        data: {
          status: "OPEN",
        },
      });

    }

    // Opcional: Abrir campeonatos com status DRAFT cuja data de início chegou
    const championshipsToOpen = await prisma.championship.findMany({
      where: {
        status: "DRAFT",
        registrationStart: {
          not: null,
          lte: now, // Data de início chegou ou passou
        },
        OR: [
          {
            registrationEnd: null, // Sem data de fim
          },
          {
            registrationEnd: {
              gte: now, // Data de fim ainda não chegou
            },
          },
        ],
      },
    });

    if (championshipsToOpen.length > 0) {
      await prisma.championship.updateMany({
        where: {
          id: {
            in: championshipsToOpen.map((c) => c.id),
          },
        },
        data: {
          status: "OPEN",
        },
      });

    }
  } catch (error) {
    console.error("Erro ao atualizar status dos campeonatos:", error);
  }
}

/**
 * Verifica se um campeonato está com inscrições abertas
 * Considera status e datas de inscrição
 */
export function isRegistrationOpen(championship: {
  status: string;
  registrationStart: Date | null;
  registrationEnd: Date | null;
}): boolean {
  // Se o status não for OPEN, não está aberto
  if (championship.status !== "OPEN") {
    return false;
  }

  const now = new Date();

  // Se há data de início e ainda não chegou, não está aberto
  if (championship.registrationStart) {
    const startDate = new Date(championship.registrationStart);
    if (now < startDate) {
      return false;
    }
  }

  // Se há data de fim e já passou, não está aberto
  if (championship.registrationEnd) {
    const endDate = new Date(championship.registrationEnd);
    if (now > endDate) {
      return false;
    }
  }

  return true;
}

/**
 * Filtra campeonatos que estão com inscrições realmente abertas
 */
export function filterOpenRegistrations<
  T extends {
    status: string;
    registrationStart: Date | null;
    registrationEnd: Date | null;
  }
>(championships: T[]): T[] {
  return championships.filter((championship) =>
    isRegistrationOpen(championship)
  );
}
