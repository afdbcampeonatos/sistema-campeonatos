"use client";

import { deleteMatch } from "@/app/actions/matches";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { useState } from "react";
import {
  FaCalendarAlt,
  FaFutbol,
  FaPlayCircle,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { CreateMatchModal } from "./CreateMatchModal";
import { GenerateMatchesModal } from "./GenerateMatchesModal";
import { ImageWithLoading } from "./ImageWithLoading";

interface Match {
  id: string;
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

interface Team {
  id: string;
  name: string;
  shieldUrl: string | null;
  status: string;
}

interface MatchManagerProps {
  championshipId: string;
  matches: Match[];
  teams: Team[];
  onMatchCreated?: () => void;
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

export const MatchManager = ({
  championshipId,
  matches,
  teams,
  onMatchCreated,
}: MatchManagerProps) => {
  const toast = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  const approvedTeams = teams.filter((team) => team.status === "APPROVED");

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

  const handleDeleteMatch = async (matchId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja deletar esta partida? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setDeletingMatchId(matchId);
    const result = await deleteMatch(matchId);
    setDeletingMatchId(null);

    if (result.success) {
      toast.success("Partida deletada com sucesso");
      onMatchCreated?.();
    } else {
      toast.error(result.error || "Erro ao deletar partida");
    }
  };

  const handleMatchCreated = () => {
    setIsCreateModalOpen(false);
    setIsGenerateModalOpen(false);
    onMatchCreated?.();
  };

  return (
    <div>
      {/* Header com botões de ação */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partidas</h2>
          <p className="text-gray-600 mt-1">
            Gerencie as partidas do campeonato
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            disabled={approvedTeams.length < 2}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaFutbol />
            Gerar Automaticamente
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={approvedTeams.length < 2}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus />
            Criar Partida
          </button>
        </div>
      </div>

      {approvedTeams.length < 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            É necessário ter pelo menos 2 times aprovados para criar partidas.
          </p>
        </div>
      )}

      {/* Lista de Partidas */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FaFutbol className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            Nenhuma partida cadastrada
          </p>
          <p className="text-gray-400 text-sm">
            Crie partidas manualmente ou gere automaticamente
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
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
                {matches.map((match) => (
                  <tr
                    key={match.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {match.status === "SCHEDULED" && (
                          <>
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              disabled={deletingMatchId === match.id}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                              title="Deletar partida"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                        {match.status !== "SCHEDULED" && (
                          <Link
                            href={`/admin/match-runner/${match.id}`}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-900 transition-colors text-sm"
                          >
                            <FaPlayCircle />
                            <span>Abrir Match Runner</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        championshipId={championshipId}
        teams={approvedTeams}
        onSuccess={handleMatchCreated}
      />

      <GenerateMatchesModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        championshipId={championshipId}
        teams={approvedTeams}
        onSuccess={handleMatchCreated}
      />
    </div>
  );
};
