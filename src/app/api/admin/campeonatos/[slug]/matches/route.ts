import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { slug } = await params;

    // Buscar campeonato
    const championship = await prisma.championship.findUnique({
      where: { slug },
    });

    if (!championship) {
      return NextResponse.json(
        { error: "Campeonato não encontrado" },
        { status: 404 }
      );
    }

    // Buscar partidas do campeonato
    const matches = await prisma.match.findMany({
      where: {
        championshipId: championship.id,
      },
      include: {
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

    return NextResponse.json({
      matches: matches.map((match) => ({
        id: match.id,
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
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar partidas do campeonato:", error);
    return NextResponse.json(
      { error: "Erro ao buscar partidas do campeonato" },
      { status: 500 }
    );
  }
}
