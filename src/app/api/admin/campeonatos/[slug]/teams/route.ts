import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verificar autenticação
    let session;
    try {
      session = await getSession();
    } catch (authError) {
      console.error("Erro ao verificar autenticação:", authError);
      return NextResponse.json(
        { error: "Erro ao verificar autenticação" },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter slug dos params
    let slug: string;
    try {
      const paramsData = await params;
      slug = paramsData.slug;
    } catch (paramsError) {
      console.error("Erro ao obter params:", paramsError);
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Slug do campeonato é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar campeonato com times e jogadores
    let championship;
    try {
      championship = await prisma.championship.findUnique({
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
    } catch (dbError) {
      console.error("Erro ao buscar campeonato:", dbError);
      return NextResponse.json(
        {
          error: "Erro ao buscar campeonato no banco de dados",
          details:
            process.env.NODE_ENV === "development"
              ? dbError instanceof Error
                ? dbError.message
                : "Erro desconhecido"
              : undefined,
        },
        { status: 500 }
      );
    }

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
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro ao buscar times do campeonato",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
