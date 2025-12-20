'use client';

import { FaTrophy, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';

interface ChampionshipContextCardProps {
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: 'abertas' | 'encerradas' | 'em-analise';
}

const statusConfig = {
  abertas: {
    label: 'Inscrições Abertas',
    color: 'bg-green-100 text-green-800',
    icon: <FaCheckCircle className="text-green-600" />
  },
  encerradas: {
    label: 'Inscrições Encerradas',
    color: 'bg-red-100 text-red-800',
    icon: <FaCheckCircle className="text-red-600" />
  },
  'em-analise': {
    label: 'Em Análise',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <FaCheckCircle className="text-yellow-600" />
  }
};

export const ChampionshipContextCard = ({
  nome,
  dataInicio,
  dataFim,
  status
}: ChampionshipContextCardProps) => {
  const statusInfo = statusConfig[status];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <FaTrophy className="text-3xl text-blue-900" />
            <h2 className="text-2xl font-bold text-gray-900">{nome}</h2>
          </div>
          
          <div className="flex flex-wrap gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-900" />
              <span className="text-sm">
                <strong>Início:</strong> {dataInicio}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-900" />
              <span className="text-sm">
                <strong>Fim:</strong> {dataFim}
              </span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.color}`}>
          {statusInfo.icon}
          <span className="text-sm font-semibold">{statusInfo.label}</span>
        </div>
      </div>
    </div>
  );
};

