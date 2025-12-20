"use client";

import { ChampionshipDetailsClient } from "@/components/ChampionshipDetailsClient";
import { ChampionshipList } from "@/components/ChampionshipList";
import { CreateChampionshipModal } from "@/components/CreateChampionshipModal";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChampionshipSlug, setSelectedChampionshipSlug] = useState<
    string | null
  >(null);
  const [selectedChampionship, setSelectedChampionship] =
    useState<ChampionshipWithTeams | null>(null);
  const [isLoadingChampionship, setIsLoadingChampionship] = useState(false);

  // Carregar detalhes do campeonato quando um slug for selecionado
  const handleViewChampionship = async (championshipSlug: string) => {
    setSelectedChampionshipSlug(championshipSlug);
    setIsLoadingChampionship(true);

    try {
      // Buscar campeonato
      const championshipResponse = await fetch(
        `/api/campeonatos/${championshipSlug}`
      );
      if (!championshipResponse.ok) {
        throw new Error("Campeonato não encontrado");
      }
      const championshipData = await championshipResponse.json();

      // Buscar times e jogadores
      const teamsResponse = await fetch(
        `/api/admin/campeonatos/${championshipSlug}/teams`
      );
      const teamsData = teamsResponse.ok
        ? await teamsResponse.json()
        : { teams: [] };

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
    } catch (error) {
      console.error("Erro ao carregar campeonato:", error);
      setSelectedChampionship(null);
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
