import { AdminSPA } from "@/components/AdminSPA";
import {
  filterOpenRegistrations,
  updateChampionshipStatuses,
} from "@/lib/championship-status";
import { prisma } from "@/lib/prisma";

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

  return (
    <AdminSPA
      initialView="dashboard"
      dashboardData={{
        championships: dashboardChampionships,
        activeCount,
        categories: dashboardCategories,
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
