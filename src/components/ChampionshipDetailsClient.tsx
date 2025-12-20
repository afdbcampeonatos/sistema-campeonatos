"use client";

import { updateTeamStatus } from "@/app/actions/teams";
import { useToast } from "@/contexts/ToastContext";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaFutbol, FaTrophy, FaUsers } from "react-icons/fa";
import { AlertDialog } from "./AlertDialog";
import { ImageWithLoading } from "./ImageWithLoading";
import { LoadingSpinner } from "./LoadingSpinner";
import { MatchManager } from "./MatchManager";
import { TeamDetailsModal } from "./TeamDetailsModal";

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
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

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

export const ChampionshipDetailsClient = ({
  championship,
  onBack,
}: ChampionshipDetailsClientProps) => {
  const toast = useToast();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [activeTab, setActiveTab] = useState<"teams" | "matches">("teams");
  const [teams, setTeams] = useState<Team[]>(championship.teams);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertData, setAlertData] = useState<{
    teamId: string;
    newStatus: string;
  } | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return "Não definida";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Carregar partidas do campeonato
  const loadMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const response = await fetch(
        `/api/admin/campeonatos/${championship.slug}/matches`
      );
      if (response.ok) {
        const data = await response.json();
        setMatches(
          data.matches.map((match: Match) => ({
            ...match,
            scheduledAt: match.scheduledAt ? new Date(match.scheduledAt) : null,
            startedAt: match.startedAt ? new Date(match.startedAt) : null,
            finishedAt: match.finishedAt ? new Date(match.finishedAt) : null,
            createdAt: new Date(match.createdAt || Date.now()),
          }))
        );
      }
    } catch (error) {
      console.error("Erro ao carregar partidas:", error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (activeTab === "matches") {
      loadMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleStatusChange = (teamId: string, newStatus: string) => {
    // Abrir AlertDialog ao invés de confirm()
    setAlertData({ teamId, newStatus });
    setIsAlertOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!alertData) return;

    const { teamId, newStatus } = alertData;
    setIsAlertOpen(false);
    setUpdatingTeamId(teamId);

    const result = await updateTeamStatus(teamId, newStatus);
    setUpdatingTeamId(null);

    if (result.success) {
      // Atualizar estado local ao invés de recarregar a página
      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === teamId ? { ...team, status: newStatus } : team
        )
      );
      toast.success(
        `Status do time atualizado para "${statusLabels[newStatus]}"`
      );
    } else {
      toast.error(result.error || "Erro ao atualizar status");
    }

    setAlertData(null);
  };

  const handleMatchCreated = () => {
    loadMatches();
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
              <h1 className="text-3xl font-bold text-gray-900">
                {championship.name}
              </h1>
              <p className="text-gray-600">{championship.category}</p>
            </div>
          </div>
        </div>

        {/* Informações do Campeonato */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informações do Campeonato
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  championship.status === "OPEN"
                    ? "bg-green-100 text-green-800"
                    : championship.status === "CLOSED"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {championship.status === "OPEN"
                  ? "Aberto"
                  : championship.status === "CLOSED"
                  ? "Encerrado"
                  : "Rascunho"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">
                Início das Inscrições
              </p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(championship.registrationStart)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Fim das Inscrições</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(championship.registrationEnd)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("teams")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "teams"
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaUsers />
                  <span>Times ({teams.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("matches")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "matches"
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaFutbol />
                  <span>Partidas ({matches.length})</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === "teams" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaUsers className="text-blue-900" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Times Inscritos ({teams.length})
                </h2>
              </div>
            </div>

            {teams.length === 0 ? (
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
                    {teams.map((team) => (
                      <tr
                        key={team.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <ImageWithLoading
                              src={team.shieldUrl}
                              alt={`Escudo do ${team.name}`}
                              className="w-10 h-10 object-cover rounded"
                              fallbackIcon={
                                <FaUsers className="text-gray-400" />
                              }
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {team.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {team.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">
                            {team.responsibleName}
                          </p>
                          <p className="text-xs text-gray-500">
                            CPF: {team.responsibleCpf}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{team.phone}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">
                            {team.players.length} jogador(es)
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              value={team.status}
                              onChange={(e) =>
                                handleStatusChange(team.id, e.target.value)
                              }
                              disabled={updatingTeamId === team.id}
                              className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer ${
                                statusColors[team.status] ||
                                "bg-gray-100 text-gray-800"
                              } ${
                                updatingTeamId === team.id
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
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
        )}

        {activeTab === "matches" && (
          <MatchManager
            championshipId={championship.id}
            matches={matches}
            teams={teams.map((team) => ({
              id: team.id,
              name: team.name,
              shieldUrl: team.shieldUrl,
              status: team.status,
            }))}
            onMatchCreated={handleMatchCreated}
          />
        )}
      </div>

      {/* Modal de Detalhes do Time */}
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      {/* AlertDialog para confirmação de mudança de status */}
      {alertData && (
        <AlertDialog
          isOpen={isAlertOpen}
          onClose={() => {
            setIsAlertOpen(false);
            setAlertData(null);
          }}
          onConfirm={handleConfirmStatusChange}
          title="Confirmar Mudança de Status"
          message={`Tem certeza que deseja alterar o status para "${
            statusLabels[alertData.newStatus]
          }"?`}
          confirmText="Confirmar"
          cancelText="Cancelar"
          variant="default"
          isLoading={updatingTeamId === alertData.teamId}
        />
      )}
    </>
  );
};
