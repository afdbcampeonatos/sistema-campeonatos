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

    // Buscar campeonato com times e jogadores
    const championship = await prisma.championship.findUnique({
      where: { slug },
      include: {
        teams: {
          include: {
            players: {
              orderBy: {
                name: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!championship) {
      return NextResponse.json(
        { error: "Campeonato não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      teams: championship.teams,
    });
  } catch (error) {
    console.error("Erro ao buscar times do campeonato:", error);
    return NextResponse.json(
      { error: "Erro ao buscar times do campeonato" },
      { status: 500 }
    );
  }
}
