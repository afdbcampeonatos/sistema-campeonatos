import { prisma } from '@/lib/prisma';
import { PublicChampionshipsClient } from '@/components/PublicChampionshipsClient';
import { updateChampionshipStatuses, filterOpenRegistrations } from '@/lib/championship-status';

interface Championship {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  createdAt: Date;
  registrationStart: Date | null;
  registrationEnd: Date | null;
}

export default async function PublicCampeonatosPage() {
  // Atualizar status dos campeonatos antes de buscar
  await updateChampionshipStatuses();

  // Buscar campeonatos com status OPEN
  let championships: Championship[] = [];

  try {
    const allChampionships = await prisma.championship.findMany({
      where: {
        status: "OPEN",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filtrar apenas os que realmente estão com inscrições abertas
    championships = filterOpenRegistrations(allChampionships);
  } catch (error) {
    console.error("Erro ao buscar campeonatos:", error);
    championships = [];
  }

  return <PublicChampionshipsClient championships={championships} />;
}
