import { AdminSPA } from "@/components/AdminSPA";
import {
  filterOpenRegistrations,
  updateChampionshipStatuses,
} from "@/lib/championship-status";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export default async function AdminPage() {
  // Atualizar status dos campeonatos antes de buscar
  await updateChampionshipStatuses();

  // Buscar dados para o dashboard
  let dashboardChampionships: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    createdAt: Date;
  }> = [];
  let activeCount = 0;
  let dashboardCategories: Array<{
    id: string;
    name: string;
    description: string | null;
    active: boolean;
  }> = [];

  // Buscar dados para campeonatos
  let campeonatosChampionships: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
    registrationStart: Date | null;
    registrationEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  let campeonatosCategories: Array<{
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  // Buscar dados para configurações
  let configuracoesCategories: Array<{
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  // Buscar dados para partidas
  let partidasMatches: Array<{
    id: string;
    championshipId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    status: string;
    currentHalf: number;
    currentMinute: number;
    scheduledAt: Date | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    createdAt: Date;
    championship: {
      id: string;
      name: string;
      slug: string;
    };
    homeTeam: {
      id: string;
      name: string;
      shieldUrl: string | null;
    };
    awayTeam: {
      id: string;
      name: string;
      shieldUrl: string | null;
    };
  }> = [];
  let partidasChampionships: Array<{
    id: string;
    name: string;
    slug: string;
  }> = [];

  // Buscar dados para times e atletas
  let timesAtletasTeams: Array<{
    id: string;
    name: string;
    category: string;
    responsibleName: string;
    responsibleCpf: string;
    phone: string;
    shieldUrl: string | null;
    status: string;
    createdAt: Date;
    championship: {
      id: string;
      name: string;
      slug: string;
    };
    players: Array<{
      id: string;
      name: string;
      rg: string;
      photoUrl: string | null;
    }>;
  }> = [];

  try {
    // Dados do dashboard
    const allChampionships = await prisma.championship.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const openChampionships = filterOpenRegistrations(allChampionships);
    activeCount = openChampionships.length;

    dashboardChampionships = allChampionships.map((champ) => ({
      id: champ.id,
      name: champ.name,
      category: champ.category,
      status: champ.status,
      createdAt: champ.createdAt,
    }));

    dashboardCategories = await prisma.category.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
      },
    });

    // Dados de campeonatos
    campeonatosChampionships = await prisma.championship.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        status: true,
        registrationStart: true,
        registrationEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    campeonatosCategories = await prisma.category.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Dados de configurações
    configuracoesCategories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Dados de partidas
    const matches = await prisma.match.findMany({
      include: {
        championship: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        homeTeam: {
          select: {
            id: true,
            name: true,
            shieldUrl: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shieldUrl: true,
          },
        },
      },
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    });

    partidasMatches = matches.map((match) => ({
      id: match.id,
      championshipId: match.championshipId,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      currentHalf: match.currentHalf,
      currentMinute: match.currentMinute,
      scheduledAt: match.scheduledAt,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt,
      createdAt: match.createdAt,
      championship: match.championship,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
    }));

    partidasChampionships = await prisma.championship.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Dados de times e atletas
    const teams = await prisma.team.findMany({
      include: {
        championship: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        players: {
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            rg: true,
            photoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    timesAtletasTeams = teams;
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  }

  // Buscar dados adicionais para o dashboard
  let matchesThisWeek = 0;
  let nextMatch: {
    homeTeam: string;
    awayTeam: string;
    scheduledAt: Date;
  } | null = null;
  let totalTeams = 0;
  let totalPlayers = 0;

  try {
    // Calcular próximos 7 dias a partir de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Início do dia
    const weekEnd = addDays(today, 7);
    weekEnd.setHours(23, 59, 59, 999); // Fim do dia

    // Contar partidas dos próximos 7 dias
    matchesThisWeek = await prisma.match.count({
      where: {
        scheduledAt: {
          gte: today,
          lte: weekEnd,
        },
        status: {
          not: "CANCELLED",
        },
      },
    });

    // Buscar próxima partida
    const nextMatchData = await prisma.match.findFirst({
      where: {
        scheduledAt: {
          gte: today,
        },
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        homeTeam: {
          select: {
            name: true,
          },
        },
        awayTeam: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    if (nextMatchData && nextMatchData.scheduledAt) {
      nextMatch = {
        homeTeam: nextMatchData.homeTeam.name,
        awayTeam: nextMatchData.awayTeam.name,
        scheduledAt: nextMatchData.scheduledAt,
      };
    }

    // Contar total de times
    totalTeams = await prisma.team.count();

    // Contar total de players
    totalPlayers = await prisma.player.count();
  } catch (error) {
    console.error("Erro ao buscar dados adicionais do dashboard:", error);
  }

  return (
    <AdminSPA
      initialView="dashboard"
      dashboardData={{
        championships: dashboardChampionships,
        activeCount,
        categories: dashboardCategories,
        matchesThisWeek,
        nextMatch,
        totalTeams,
        totalPlayers,
      }}
      campeonatosData={{
        championships: campeonatosChampionships,
        categories: campeonatosCategories,
      }}
      partidasData={{
        matches: partidasMatches,
        championships: partidasChampionships,
      }}
      timesAtletasData={{
        teams: timesAtletasTeams,
      }}
      configuracoesData={{
        categories: configuracoesCategories,
      }}
    />
  );
}
