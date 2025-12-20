import { updateChampionshipStatuses } from "@/lib/championship-status";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Atualizar status dos campeonatos antes de buscar
    await updateChampionshipStatuses();

    const { slug } = await params;

    // Buscar campeonato pelo slug
    const championship = await prisma.championship.findUnique({
      where: { slug },
    });

    if (!championship) {
      return NextResponse.json(
        { error: "Campeonato não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(championship);
  } catch (error) {
    console.error("Erro ao buscar campeonato:", error);
    return NextResponse.json(
      { error: "Erro ao buscar campeonato" },
      { status: 500 }
    );
  }
}
