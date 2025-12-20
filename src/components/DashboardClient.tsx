"use client";

import { ChampionshipTable } from "@/components/ChampionshipTable";
import { CreateChampionshipModal } from "@/components/CreateChampionshipModal";
import { InfoCard } from "@/components/InfoCard";
import { KPICard } from "@/components/KPICard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { FaCalendarAlt, FaTrophy } from "react-icons/fa";
import { HiPlus } from "react-icons/hi";

interface Championship {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface DashboardClientProps {
  championships: Championship[];
  activeCount: number;
  categories: Category[];
  matchesThisWeek: number;
  nextMatch: {
    homeTeam: string;
    awayTeam: string;
    scheduledAt: Date;
  } | null;
  totalTeams: number;
  totalPlayers: number;
}

export const DashboardClient = ({
  championships,
  activeCount,
  categories,
  matchesThisWeek,
  nextMatch,
  totalTeams,
  totalPlayers,
}: DashboardClientProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mapear status do banco para o formato esperado pela tabela
  const mappedChampionships = championships.map((champ) => ({
    id: champ.id,
    nome: champ.name,
    categoria: champ.category,
    status:
      champ.status === "OPEN"
        ? ("ativo" as const)
        : champ.status === "CLOSED"
        ? ("finalizado" as const)
        : ("planejado" as const),
  }));

  return (
    <>
      <div>
        {/* Título e Botão */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            Visão Geral
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-900 text-white px-4 py-3 md:py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium h-12 md:h-10"
          >
            <HiPlus className="text-lg" />
            Novo Campeonato
          </button>
        </div>

        {/* Grid de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <KPICard
            title="Campeonatos Ativos"
            value={activeCount}
            icon={<FaTrophy />}
          />
          <KPICard
            title="Jogos na Semana"
            value={matchesThisWeek}
            icon={<FaCalendarAlt />}
          />
        </div>

        {/* Grid de Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabela de Campeonatos - Ocupa 2 colunas */}
          <div className="lg:col-span-2">
            <ChampionshipTable championships={mappedChampionships} />
          </div>

          {/* Card Lateral - Ocupa 1 coluna */}
          <div>
            <InfoCard title="Informações Rápidas">
              <div className="space-y-3">
                {nextMatch ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Próximo Jogo
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {nextMatch.homeTeam} vs {nextMatch.awayTeam}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(nextMatch.scheduledAt, "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Próximo Jogo
                    </p>
                    <p className="text-sm text-gray-500">
                      Nenhum jogo agendado
                    </p>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm font-medium text-gray-900">
                    Times Cadastrados
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {totalTeams}
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm font-medium text-gray-900">
                    Atletas Cadastrados
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {totalPlayers.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>

      {/* Modal de Criação - Renderizado fora do container principal */}
      <CreateChampionshipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
      />
    </>
  );
};
