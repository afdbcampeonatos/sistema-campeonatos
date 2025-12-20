'use client';

import { FaTrophy } from 'react-icons/fa';

interface Championship {
  id: string;
  nome: string;
  categoria: string;
  status: 'ativo' | 'finalizado' | 'planejado';
}

interface ChampionshipTableProps {
  championships: Championship[];
}

const statusColors = {
  ativo: 'bg-green-100 text-green-800',
  finalizado: 'bg-gray-100 text-gray-800',
  planejado: 'bg-blue-100 text-blue-800'
};

const statusLabels = {
  ativo: 'Ativo',
  finalizado: 'Finalizado',
  planejado: 'Planejado'
};

export const ChampionshipTable = ({ championships }: ChampionshipTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Últimos Campeonatos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {championships.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  Nenhum campeonato encontrado
                </td>
              </tr>
            ) : (
              championships.map((championship) => (
                <tr key={championship.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FaTrophy className="text-blue-900" />
                      <span className="text-sm font-medium text-gray-900">
                        {championship.nome}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{championship.categoria}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[championship.status]
                      }`}
                    >
                      {statusLabels[championship.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

