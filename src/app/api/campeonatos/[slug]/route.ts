import { updateChampionshipStatuses } from "@/lib/championship-status";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Atualizar status dos campeonatos antes de buscar
    try {
      await updateChampionshipStatuses();
    } catch (statusError) {
      console.error("Erro ao atualizar status dos campeonatos:", statusError);
      // Não falhar completamente se updateChampionshipStatuses falhar
      // Apenas logar o erro e continuar
    }

    // Obter slug dos params
    let slug: string;
    try {
      const paramsData = await params;
      slug = paramsData.slug;
    } catch (paramsError) {
      console.error("[API] Erro ao obter params:", paramsError);
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== "string") {
      console.error("[API] Slug inválido:", slug);
      return NextResponse.json(
        { error: "Slug do campeonato é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar campeonato pelo slug
    let championship;
    try {
      championship = await prisma.championship.findUnique({
        where: { slug },
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

    return NextResponse.json(championship);
  } catch (error) {
    console.error("Erro ao buscar campeonato:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro ao buscar campeonato",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
