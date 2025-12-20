"use client";

import Link from "next/link";
import { useState } from "react";
import { FaCalendarAlt, FaFutbol, FaPlayCircle } from "react-icons/fa";
import { ImageWithLoading } from "./ImageWithLoading";

interface Match {
  id: string;
  championshipId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  currentHalf: number;
  currentMinute: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  championship: {
    id: string;
    name: string;
    slug: string;
  };
  homeTeam: {
    id: string;
    name: string;
    shieldUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    shieldUrl: string | null;
  };
}

interface Championship {
  id: string;
  name: string;
  slug: string;
}

interface PartidasClientProps {
  matches: Match[];
  championships: Championship[];
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  FIRST_HALF: "1º Tempo",
  HALFTIME: "Intervalo",
  SECOND_HALF: "2º Tempo",
  FINISHED: "Finalizada",
  CANCELLED: "Cancelada",
  PAUSED: "Pausada",
};

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-gray-100 text-gray-800",
  FIRST_HALF: "bg-blue-100 text-blue-800",
  HALFTIME: "bg-yellow-100 text-yellow-800",
  SECOND_HALF: "bg-blue-100 text-blue-800",
  FINISHED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  PAUSED: "bg-orange-100 text-orange-800",
};

export const PartidasClient = ({
  matches,
  championships,
}: PartidasClientProps) => {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<
    string | null
  >(null);

  const filteredMatches = selectedChampionshipId
    ? matches.filter((m) => m.championshipId === selectedChampionshipId)
    : matches;

  const formatDate = (date: Date | null) => {
    if (!date) return "Não agendada";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Partidas</h1>
        <p className="text-gray-600 mt-2">
          Gerencie e acompanhe as partidas dos campeonatos
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Filtrar por Campeonato:
          </label>
          <select
            value={selectedChampionshipId || ""}
            onChange={(e) =>
              setSelectedChampionshipId(e.target.value ? e.target.value : null)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos os campeonatos</option>
            {championships.map((champ) => (
              <option key={champ.id} value={champ.id}>
                {champ.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Partidas */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FaFutbol className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {selectedChampionshipId
              ? "Nenhuma partida encontrada para este campeonato"
              : "Nenhuma partida cadastrada"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campeonato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map((match) => (
                  <tr
                    key={match.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {match.championship.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <ImageWithLoading
                            src={match.homeTeam.shieldUrl}
                            alt={match.homeTeam.name}
                            className="w-8 h-8 object-cover rounded"
                            size="sm"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {match.homeTeam.name}
                          </span>
                        </div>
                        <span className="text-gray-400">vs</span>
                        <div className="flex items-center gap-2 flex-1">
                          <ImageWithLoading
                            src={match.awayTeam.shieldUrl}
                            alt={match.awayTeam.name}
                            className="w-8 h-8 object-cover rounded"
                            size="sm"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {match.awayTeam.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          {match.homeScore}
                        </span>
                        <span className="text-gray-400">:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {match.awayScore}
                        </span>
                        {match.status !== "SCHEDULED" &&
                          match.status !== "FINISHED" &&
                          match.status !== "CANCELLED" && (
                            <span className="text-xs text-gray-500">
                              ({match.currentMinute}&apos;)
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          statusColors[match.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusLabels[match.status] || match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaCalendarAlt />
                        <span>{formatDate(match.scheduledAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/match-runner/${match.id}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <FaPlayCircle />
                        <span>Abrir Match Runner</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
