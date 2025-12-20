'use client';

import { FaTimes, FaUser, FaIdCard, FaPhone, FaUsers, FaImage } from 'react-icons/fa';

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

interface TeamDetailsModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
}

export const TeamDetailsModal = ({ team, isOpen, onClose }: TeamDetailsModalProps) => {
  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    // Remove tudo que não é número primeiro
    const numbers = phone.replace(/\D/g, '');
    
    // Formata baseado no tamanho
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone; // Retorna original se não tiver formato esperado
  };

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {team.shieldUrl ? (
              <img
                src={team.shieldUrl}
                alt={`Escudo do ${team.name}`}
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <FaUsers className="text-gray-400 text-2xl" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
              <p className="text-gray-600">{team.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status */}
          <div className="mb-6">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              statusColors[team.status] || 'bg-gray-100 text-gray-800'
            }`}>
              Status: {statusLabels[team.status] || team.status}
            </span>
          </div>

          {/* Informações do Responsável */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaUser className="text-blue-900" />
              Responsável/Técnico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nome Completo</p>
                <p className="text-sm font-medium text-gray-900">{team.responsibleName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <FaIdCard /> CPF
                </p>
                <p className="text-sm font-medium text-gray-900">{formatCPF(team.responsibleCpf)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <FaPhone /> Contato
                </p>
                <p className="text-sm font-medium text-gray-900">{formatPhone(team.phone)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Data de Inscrição</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(team.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Lista de Jogadores */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaUsers className="text-blue-900" />
              Jogadores ({team.players.length})
            </h3>

            {team.players.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum jogador cadastrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Foto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RG
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {team.players.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          {player.photoUrl ? (
                            <img
                              src={player.photoUrl}
                              alt={player.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <FaImage className="text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{player.name}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{player.rg}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

