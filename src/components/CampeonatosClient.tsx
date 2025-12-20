"use client";

import { ChampionshipDetailsClient } from "@/components/ChampionshipDetailsClient";
import { ChampionshipList } from "@/components/ChampionshipList";
import { CreateChampionshipModal } from "@/components/CreateChampionshipModal";
import { useToast } from "@/contexts/ToastContext";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";

interface Championship {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface Team {
  id: string;
  name: string;
  category: string;
  responsibleName: string;
  responsibleCpf: string;
  phone: string;
  shieldUrl: string | null;
  status: string;
  createdAt: Date;
  players: Array<{
    id: string;
    name: string;
    rg: string;
    photoUrl: string | null;
  }>;
}

interface ChampionshipWithTeams extends Championship {
  registrationStart: Date | null;
  registrationEnd: Date | null;
  teams: Team[];
}

interface CampeonatosClientProps {
  championships: Championship[];
  categories: Category[];
}

export const CampeonatosClient = ({
  championships,
  categories,
}: CampeonatosClientProps) => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChampionshipSlug, setSelectedChampionshipSlug] = useState<
    string | null
  >(null);
  const [selectedChampionship, setSelectedChampionship] =
    useState<ChampionshipWithTeams | null>(null);
  const [isLoadingChampionship, setIsLoadingChampionship] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar detalhes do campeonato quando um slug for selecionado
  const handleViewChampionship = async (championshipSlug: string) => {
    setSelectedChampionshipSlug(championshipSlug);
    setIsLoadingChampionship(true);
    setError(null);

    try {
      // Buscar campeonato
      let championshipResponse: Response;
      try {
        championshipResponse = await fetch(
          `/api/campeonatos/${championshipSlug}`
        );
      } catch (networkError) {
        console.error("Erro de rede ao buscar campeonato:", networkError);
        throw new Error(
          "Erro de conexão. Verifique sua internet e tente novamente."
        );
      }

      if (!championshipResponse.ok) {
        const status = championshipResponse.status;
        let errorMessage = "Erro ao carregar campeonato";

        if (status === 404) {
          errorMessage = "Campeonato não encontrado";
        } else if (status === 401) {
          errorMessage = "Não autorizado. Faça login novamente.";
        } else if (status >= 500) {
          errorMessage = "Erro no servidor. Tente novamente mais tarde.";
        }

        // Tentar obter mensagem de erro da resposta
        try {
          const errorData = await championshipResponse.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Se não conseguir parsear JSON, usar mensagem padrão
        }

        console.error(`Erro HTTP ${status}:`, errorMessage);
        throw new Error(errorMessage);
      }

      // Parse JSON do campeonato
      let championshipData: any;
      try {
        championshipData = await championshipResponse.json();
      } catch (parseError) {
        console.error("Erro ao parsear JSON do campeonato:", parseError);
        throw new Error("Resposta inválida do servidor");
      }

      // Validar dados do campeonato
      if (!championshipData || !championshipData.id) {
        throw new Error("Dados do campeonato inválidos");
      }

      // Buscar times e jogadores
      let teamsData: { teams?: Team[] } = { teams: [] };
      try {
        const teamsResponse = await fetch(
          `/api/admin/campeonatos/${championshipSlug}/teams`
        );

        if (teamsResponse.ok) {
          try {
            teamsData = await teamsResponse.json();
          } catch (parseError) {
            console.error("Erro ao parsear JSON dos times:", parseError);
            // Continuar com array vazio se não conseguir parsear
            teamsData = { teams: [] };
          }
        } else {
          // Não falhar completamente se não conseguir buscar times
          // Apenas usar array vazio
          teamsData = { teams: [] };
        }
      } catch (networkError) {
        console.error("Erro de rede ao buscar times:", networkError);
        // Continuar com array vazio se houver erro de rede
        teamsData = { teams: [] };
      }

      // Converter datas se necessário
      const championship: ChampionshipWithTeams = {
        ...championshipData,
        registrationStart: championshipData.registrationStart
          ? new Date(championshipData.registrationStart)
          : null,
        registrationEnd: championshipData.registrationEnd
          ? new Date(championshipData.registrationEnd)
          : null,
        createdAt: new Date(championshipData.createdAt),
        teams: (teamsData.teams || []).map((team: Team) => ({
          ...team,
          createdAt: new Date(team.createdAt),
          players: team.players || [],
        })),
      };

      setSelectedChampionship(championship);
      setError(null);
    } catch (error) {
      console.error("Erro ao carregar campeonato:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao carregar campeonato";
      setError(errorMessage);
      setSelectedChampionship(null);
      toast.error(errorMessage);
    } finally {
      setIsLoadingChampionship(false);
    }
  };

  const handleBackToList = () => {
    setSelectedChampionshipSlug(null);
    setSelectedChampionship(null);
  };

  // Se um campeonato está selecionado, mostrar detalhes
  if (selectedChampionshipSlug && selectedChampionship) {
    return (
      <ChampionshipDetailsClient
        championship={selectedChampionship}
        onBack={handleBackToList}
      />
    );
  }

  if (selectedChampionshipSlug && isLoadingChampionship) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">
          Carregando detalhes do campeonato...
        </div>
      </div>
    );
  }

  if (selectedChampionshipSlug && error && !isLoadingChampionship) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-600 font-medium">{error}</div>
        <button
          onClick={handleBackToList}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Voltar para lista
        </button>
      </div>
    );
  }

  // Mostrar lista de campeonatos
  return (
    <>
      <div>
        {/* Título e Botão */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Campeonatos</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium"
          >
            <FaPlus />
            Novo Campeonato
          </button>
        </div>

        {/* Lista de Campeonatos */}
        <ChampionshipList
          championships={championships}
          categories={categories}
          onViewChampionship={handleViewChampionship}
        />
      </div>

      {/* Modal de Criação */}
      <CreateChampionshipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
      />
    </>
  );
};
