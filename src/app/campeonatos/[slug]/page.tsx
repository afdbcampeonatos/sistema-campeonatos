import { InscricaoClient } from "@/components/InscricaoClient";
import { updateChampionshipStatuses } from "@/lib/championship-status";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InscricaoPage({ params }: PageProps) {
  const { slug } = await params;

  // Atualizar status dos campeonatos antes de buscar
  await updateChampionshipStatuses();

  // Buscar campeonato pelo slug
  let championship = null;

  try {
    championship = await prisma.championship.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error("Erro ao buscar campeonato:", error);
    championship = null;
  }

  if (!championship) {
    redirect("/campeonatos");
  }

  // Transformar os dados para o formato esperado pelo client
  const championshipData = {
    id: championship.id,
    name: championship.name,
    slug: championship.slug,
    category: championship.category,
    status: championship.status,
    registrationStart: championship.registrationStart?.toISOString() || null,
    registrationEnd: championship.registrationEnd?.toISOString() || null,
  };

  return <InscricaoClient initialChampionshipData={championshipData} />;
}
