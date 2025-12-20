'use client';

import { useState } from 'react';
import { TeamDetailsModal } from './TeamDetailsModal';
import { updateTeamStatus } from '@/app/actions/teams';
import { LoadingSpinner } from './LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';
import { FaTrophy, FaUsers, FaPhone, FaIdCard } from 'react-icons/fa';
import { maskCPF, maskPhone } from '@/lib/masks';

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
  championship: {
    id: string;
    name: string;
    slug: string;
  };
  players: Player[];
}

interface TimesAtletasClientProps {
  teams: Team[];
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

export const TimesAtletasClient = ({ teams }: TimesAtletasClientProps) => {
  const toast = useToast();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleStatusChange = async (teamId: string, newStatus: string) => {
    if (!confirm(`Tem certeza que deseja alterar o status para ${statusLabels[newStatus]}?`)) {
      return;
    }

    setUpdatingTeamId(teamId);
    try {
      const result = await updateTeamStatus(teamId, newStatus);
      if (result.success) {
        toast.success(`Status do time atualizado para ${statusLabels[newStatus]}!`);
        // Recarregar a página para atualizar os dados
        window.location.reload();
      } else {
        toast.error(result.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error("Erro ao atualizar status do time:", error);
      toast.error('Erro inesperado ao atualizar status');
    } finally {
      setUpdatingTeamId(null);
    }
  };

  // Calcular estatísticas
  const totalTeams = teams.length;
  const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);
  const pendingTeams = teams.filter(team => team.status === 'PENDING').length;
  const approvedTeams = teams.filter(team => team.status === 'APPROVED').length;

  return (
    <div>
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Times e Atletas</h1>
        <p className="text-gray-600 mt-2">Gerencie os times inscritos e seus atletas</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Times</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalTeams}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaTrophy className="text-blue-900 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Atletas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalPlayers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FaUsers className="text-green-900 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pendingTeams}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{approvedTeams}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Times */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Todos os Times ({teams.length})
          </h2>
        </div>
        {teams.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhum time cadastrado ainda.
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
                    Campeonato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atletas
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
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {team.shieldUrl ? (
                          <img
                            src={team.shieldUrl}
                            alt={`Escudo do ${team.name}`}
                            className="h-10 w-10 object-contain rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            <FaTrophy />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {team.name}
                          </div>
                          <div className="text-xs text-gray-500">{team.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {team.championship.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {team.responsibleName}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <FaIdCard className="text-xs" />
                        {maskCPF(team.responsibleCpf)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        <FaPhone className="text-xs text-gray-400" />
                        {maskPhone(team.phone)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <FaUsers className="text-xs" />
                        {team.players.length} jogadores
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      <select
                        value={team.status}
                        onChange={(e) => handleStatusChange(team.id, e.target.value)}
                        disabled={updatingTeamId === team.id}
                        className={`appearance-none text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer ${
                          statusColors[team.status] || 'bg-gray-100 text-gray-800'
                        } ${updatingTeamId === team.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="APPROVED">Aprovado</option>
                        <option value="REJECTED">Rejeitado</option>
                      </select>
                      {updatingTeamId === team.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                          <LoadingSpinner size="sm" className="text-blue-900" />
                        </div>
                      )}
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

      {/* Modal de Detalhes do Time */}
      {selectedTeam && (
        <TeamDetailsModal
          team={{
            id: selectedTeam.id,
            name: selectedTeam.name,
            category: selectedTeam.category,
            responsibleName: selectedTeam.responsibleName,
            responsibleCpf: selectedTeam.responsibleCpf,
            phone: selectedTeam.phone,
            shieldUrl: selectedTeam.shieldUrl,
            status: selectedTeam.status,
            createdAt: selectedTeam.createdAt,
            players: selectedTeam.players,
          }}
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
};

