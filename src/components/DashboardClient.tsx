'use client';

import { useState } from 'react';
import { KPICard } from '@/components/KPICard';
import { ChampionshipTable } from '@/components/ChampionshipTable';
import { InfoCard } from '@/components/InfoCard';
import { CreateChampionshipModal } from '@/components/CreateChampionshipModal';
import { FaTrophy, FaCalendarAlt } from 'react-icons/fa';
import { HiPlus } from 'react-icons/hi';

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
}

export const DashboardClient = ({
  championships,
  activeCount,
  categories,
}: DashboardClientProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mapear status do banco para o formato esperado pela tabela
  const mappedChampionships = championships.map((champ) => ({
    id: champ.id,
    nome: champ.name,
    categoria: champ.category,
    status: champ.status === 'OPEN' ? 'ativo' as const : 
            champ.status === 'CLOSED' ? 'finalizado' as const : 
            'planejado' as const,
  }));

  return (
    <>
      <div>
            {/* Título e Botão */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium"
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
              value="24"
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
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Próximo Jogo
                    </p>
                    <p className="text-sm text-gray-600">15/01/2024 - 20:00</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm font-medium text-gray-900">
                      Times Cadastrados
                    </p>
                    <p className="text-2xl font-bold text-blue-900">48</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm font-medium text-gray-900">
                      Atletas Cadastrados
                    </p>
                    <p className="text-2xl font-bold text-blue-900">1.234</p>
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

