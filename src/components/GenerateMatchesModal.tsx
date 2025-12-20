"use client";

import { generateMatches } from "@/app/actions/matches";
import { useToast } from "@/contexts/ToastContext";
import { calculateMatchCount } from "@/lib/utils/match-generators";
import { FormEvent, useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { DateTimePicker } from "./DateTimePicker";
import { LoadingSpinner } from "./LoadingSpinner";

interface Team {
  id: string;
  name: string;
  shieldUrl: string | null;
  status: string;
}

interface GenerateMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  championshipId: string;
  teams: Team[];
  onSuccess?: () => void;
}

type FormatType = "round-robin" | "single-elimination" | "group-stage";

export const GenerateMatchesModal = ({
  isOpen,
  onClose,
  championshipId,
  teams,
  onSuccess,
}: GenerateMatchesModalProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [format, setFormat] = useState<FormatType>("round-robin");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [roundRobinReturn, setRoundRobinReturn] = useState(false);
  const [includeThirdPlace, setIncludeThirdPlace] = useState(false);
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [teamsPerGroup, setTeamsPerGroup] = useState(2);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [daysBetweenMatches, setDaysBetweenMatches] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calcular times por grupo quando número de grupos muda
  useEffect(() => {
    if (format === "group-stage" && selectedTeamIds.length > 0) {
      const calculated = Math.ceil(selectedTeamIds.length / numberOfGroups);
      setTeamsPerGroup(calculated);
    }
  }, [format, numberOfGroups, selectedTeamIds.length]);

  // Calcular número de partidas
  const matchCount = calculateMatchCount(format, selectedTeamIds.length, {
    roundRobinReturn,
    numberOfGroups: numberOfGroups,
    teamsPerGroup,
  });

  if (!isOpen) return null;

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
    setErrors({});
  };

  const handleSelectAll = () => {
    if (selectedTeamIds.length === teams.length) {
      setSelectedTeamIds([]);
    } else {
      setSelectedTeamIds(teams.map((t) => t.id));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    // Validações
    if (selectedTeamIds.length < 2) {
      setErrors({
        teams: "Selecione pelo menos 2 times",
      });
      return;
    }

    if (format === "single-elimination") {
      // Verificar se é potência de 2
      const isPowerOfTwo =
        selectedTeamIds.length > 0 &&
        (selectedTeamIds.length & (selectedTeamIds.length - 1)) === 0;
      if (!isPowerOfTwo) {
        setErrors({
          format:
            "Mata-mata requer número de times que seja potência de 2 (2, 4, 8, 16, etc.)",
        });
        return;
      }
    }

    if (format === "group-stage") {
      if (numberOfGroups * teamsPerGroup !== selectedTeamIds.length) {
        setErrors({
          groups: `Número de grupos (${numberOfGroups}) × times por grupo (${teamsPerGroup}) deve ser igual ao número de times selecionados (${selectedTeamIds.length})`,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await generateMatches({
        championshipId,
        format,
        teamIds: selectedTeamIds,
        roundRobinReturn:
          format === "round-robin" ? roundRobinReturn : undefined,
        includeThirdPlace:
          format === "single-elimination" ? includeThirdPlace : undefined,
        numberOfGroups: format === "group-stage" ? numberOfGroups : undefined,
        teamsPerGroup: format === "group-stage" ? teamsPerGroup : undefined,
        startDate: startDate ? startDate.toISOString() : null,
        daysBetweenMatches: daysBetweenMatches || undefined,
      });

      if (result.success) {
        toast.success(
          `${
            result.data?.matchesCreated || 0
          } partida(s) criada(s) com sucesso!`
        );
        // Reset form
        setFormat("round-robin");
        setSelectedTeamIds([]);
        setRoundRobinReturn(false);
        setIncludeThirdPlace(false);
        setNumberOfGroups(2);
        setTeamsPerGroup(2);
        setStartDate(null);
        setDaysBetweenMatches(0);
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Erro ao gerar partidas");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error("Error generating matches:", error);
      toast.error("Erro ao gerar partidas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormat("round-robin");
      setSelectedTeamIds([]);
      setRoundRobinReturn(false);
      setIncludeThirdPlace(false);
      setNumberOfGroups(2);
      setTeamsPerGroup(2);
      setStartDate(null);
      setDaysBetweenMatches(0);
      setErrors({});
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Gerar Partidas Automaticamente
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de Chaveamento <span className="text-red-500">*</span>
              </label>
              <select
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value as FormatType);
                  setErrors({});
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.format ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              >
                <option value="round-robin">
                  Todos contra Todos (Round Robin)
                </option>
                <option value="single-elimination">
                  Mata-mata (Eliminação Simples)
                </option>
                <option value="group-stage">Fase de Grupos</option>
              </select>
              {errors.format && (
                <p className="mt-1 text-sm text-red-600">{errors.format}</p>
              )}
            </div>

            {/* Seleção de Times */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Times <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedTeamIds.length === teams.length
                    ? "Desmarcar Todos"
                    : "Selecionar Todos"}
                </button>
              </div>
              <div
                className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${
                  errors.teams ? "border-red-500" : "border-gray-300"
                }`}
              >
                {teams.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhum time aprovado disponível
                  </p>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <label
                        key={team.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeamIds.includes(team.id)}
                          onChange={() => handleTeamToggle(team.id)}
                          disabled={isSubmitting}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900">
                          {team.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {errors.teams && (
                <p className="mt-1 text-sm text-red-600">{errors.teams}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {selectedTeamIds.length} time(s) selecionado(s)
              </p>
            </div>

            {/* Opções específicas por formato */}
            {format === "round-robin" && (
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={roundRobinReturn}
                    onChange={(e) => setRoundRobinReturn(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Ida e volta (cada time joga em casa e fora)
                  </span>
                </label>
              </div>
            )}

            {format === "single-elimination" && (
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeThirdPlace}
                    onChange={(e) => setIncludeThirdPlace(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Incluir partida de 3º lugar
                  </span>
                </label>
              </div>
            )}

            {format === "group-stage" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Grupos
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={numberOfGroups}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 2) {
                        setNumberOfGroups(value);
                        setErrors({});
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.groups ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Times por Grupo
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={teamsPerGroup}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 2) {
                        setTeamsPerGroup(value);
                        setErrors({});
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.groups ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Total: {numberOfGroups * teamsPerGroup} times
                  </p>
                </div>
              </div>
            )}

            {errors.groups && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.groups}</p>
              </div>
            )}

            {/* Agendamento */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Agendamento (Opcional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início
                  </label>
                  <DateTimePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Selecione data e hora de início"
                    disabled={isSubmitting}
                    minDate={new Date()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias entre Partidas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={daysBetweenMatches}
                    onChange={(e) =>
                      setDaysBetweenMatches(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Deixe 0 para agendar todas no mesmo dia
                  </p>
                </div>
              </div>
            </div>

            {/* Resumo */}
            {selectedTeamIds.length >= 2 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Resumo:
                </p>
                <p className="text-sm text-blue-800">
                  Serão criadas aproximadamente <strong>{matchCount}</strong>{" "}
                  partida(s) com <strong>{selectedTeamIds.length}</strong>{" "}
                  time(s) no formato <strong>{format}</strong>
                </p>
              </div>
            )}

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              const form = document.querySelector("form");
              form?.requestSubmit();
            }}
            disabled={
              isSubmitting ||
              selectedTeamIds.length < 2 ||
              (format === "group-stage" &&
                numberOfGroups * teamsPerGroup !== selectedTeamIds.length)
            }
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isSubmitting ? "Gerando..." : "Gerar Partidas"}
          </button>
        </div>
      </div>
    </div>
  );
};
