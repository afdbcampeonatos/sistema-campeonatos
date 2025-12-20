'use client';

import { useState } from 'react';
import { TeamDetailsModal } from './TeamDetailsModal';
import { LoadingSpinner } from './LoadingSpinner';
import { FaTrophy, FaUsers, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { updateTeamStatus } from '@/app/actions/teams';
import { useToast } from '@/contexts/ToastContext';

interface Player {
  id: string;
  name: string;
  rg: string;
  photoUrl: string | null;
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
  players: Player[];
}

interface Championship {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  createdAt: Date;
  teams: Team[];
}

interface ChampionshipDetailsClientProps {
  championship: Championship;
  onBack?: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

export const ChampionshipDetailsClient = ({
  championship,
  onBack,
}: ChampionshipDetailsClientProps) => {
  const toast = useToast();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Não definida';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (teamId: string, newStatus: string) => {
    if (!confirm(`Tem certeza que deseja alterar o status para "${statusLabels[newStatus]}"?`)) {
      return;
    }

    setUpdatingTeamId(teamId);
    const result = await updateTeamStatus(teamId, newStatus);
    setUpdatingTeamId(null);

    if (result.success) {
      toast.success(`Status do time atualizado para "${statusLabels[newStatus]}"`);
      window.location.reload();
    } else {
      toast.error(result.error || 'Erro ao atualizar status');
    }
  };

  return (
    <>
      <div>
        {/* Cabeçalho */}
        {onBack && (
          <div className="mb-6">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <FaArrowLeft />
              Voltar para Campeonatos
            </button>
          </div>
        )}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaTrophy className="text-blue-900 text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{championship.name}</h1>
              <p className="text-gray-600">{championship.category}</p>
            </div>
          </div>
        </div>

        {/* Informações do Campeonato */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Campeonato</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                championship.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                championship.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {championship.status === 'OPEN' ? 'Aberto' :
                 championship.status === 'CLOSED' ? 'Encerrado' : 'Rascunho'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Início das Inscrições</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(championship.registrationStart)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Fim das Inscrições</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(championship.registrationEnd)}</p>
            </div>
          </div>
        </div>

        {/* Lista de Times */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaUsers className="text-blue-900" />
              <h2 className="text-lg font-semibold text-gray-900">
                Times Inscritos ({championship.teams.length})
              </h2>
            </div>
          </div>

          {championship.teams.length === 0 ? (
            <div className="p-12 text-center">
              <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum time inscrito ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jogadores
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {championship.teams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {team.shieldUrl ? (
                            <img
                              src={team.shieldUrl}
                              alt={`Escudo do ${team.name}`}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <FaUsers className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{team.name}</p>
                            <p className="text-xs text-gray-500">{team.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{team.responsibleName}</p>
                        <p className="text-xs text-gray-500">CPF: {team.responsibleCpf}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{team.phone}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{team.players.length} jogador(es)</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={team.status}
                            onChange={(e) => handleStatusChange(team.id, e.target.value)}
                            disabled={updatingTeamId === team.id}
                            className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer ${
                              statusColors[team.status] || 'bg-gray-100 text-gray-800'
                            } ${updatingTeamId === team.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <option value="PENDING">Pendente</option>
                            <option value="APPROVED">Aprovado</option>
                            <option value="REJECTED">Rejeitado</option>
                          </select>
                          {updatingTeamId === team.id && (
                            <LoadingSpinner size="sm" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Time */}
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </>
  );
};

