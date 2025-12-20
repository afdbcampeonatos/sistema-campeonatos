"use client";

import { createMatch } from "@/app/actions/matches";
import { useToast } from "@/contexts/ToastContext";
import { FormEvent, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { DateTimePicker } from "./DateTimePicker";
import { ImageWithLoading } from "./ImageWithLoading";
import { LoadingSpinner } from "./LoadingSpinner";

interface Team {
  id: string;
  name: string;
  shieldUrl: string | null;
  status: string;
}

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  championshipId: string;
  teams: Team[];
  onSuccess?: () => void;
}

export const CreateMatchModal = ({
  isOpen,
  onClose,
  championshipId,
  teams,
  onSuccess,
}: CreateMatchModalProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [homeTeamId, setHomeTeamId] = useState<string>("");
  const [awayTeamId, setAwayTeamId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    // Validações
    if (!homeTeamId) {
      setErrors({ homeTeamId: "Selecione o time da casa" });
      return;
    }

    if (!awayTeamId) {
      setErrors({ awayTeamId: "Selecione o time visitante" });
      return;
    }

    if (homeTeamId === awayTeamId) {
      setErrors({
        awayTeamId: "Os times devem ser diferentes",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createMatch({
        championshipId,
        homeTeamId,
        awayTeamId,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
      });

      if (result.success) {
        toast.success("Partida criada com sucesso!");
        // Reset form
        setHomeTeamId("");
        setAwayTeamId("");
        setScheduledAt(null);
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Erro ao criar partida");
        if (result.error?.includes("já existe")) {
          setErrors({
            awayTeamId: result.error,
          });
        }
      }
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Erro ao criar partida");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setHomeTeamId("");
      setAwayTeamId("");
      setScheduledAt(null);
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
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Criar Partida</h2>
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
            {/* Time da Casa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time da Casa <span className="text-red-500">*</span>
              </label>
              <select
                value={homeTeamId}
                onChange={(e) => {
                  setHomeTeamId(e.target.value);
                  setErrors({});
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.homeTeamId ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Selecione o time da casa</option>
                {teams
                  .filter((team) => team.id !== awayTeamId)
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
              {errors.homeTeamId && (
                <p className="mt-1 text-sm text-red-600">{errors.homeTeamId}</p>
              )}
            </div>

            {/* Time Visitante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Visitante <span className="text-red-500">*</span>
              </label>
              <select
                value={awayTeamId}
                onChange={(e) => {
                  setAwayTeamId(e.target.value);
                  setErrors({});
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.awayTeamId ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Selecione o time visitante</option>
                {teams
                  .filter((team) => team.id !== homeTeamId)
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
              {errors.awayTeamId && (
                <p className="mt-1 text-sm text-red-600">{errors.awayTeamId}</p>
              )}
            </div>

            {/* Data e Hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora (Opcional)
              </label>
              <DateTimePicker
                value={scheduledAt}
                onChange={setScheduledAt}
                placeholder="Selecione data e hora"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Deixe em branco para agendar depois
              </p>
            </div>

            {/* Preview da Partida */}
            {homeTeamId && awayTeamId && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Preview da Partida:
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    {teams.find((t) => t.id === homeTeamId)?.shieldUrl && (
                      <ImageWithLoading
                        src={
                          teams.find((t) => t.id === homeTeamId)?.shieldUrl ||
                          null
                        }
                        alt={teams.find((t) => t.id === homeTeamId)?.name || ""}
                        className="w-10 h-10 object-cover rounded"
                        size="sm"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {teams.find((t) => t.id === homeTeamId)?.name}
                    </span>
                  </div>
                  <span className="text-gray-400">vs</span>
                  <div className="flex items-center gap-2 flex-1">
                    {teams.find((t) => t.id === awayTeamId)?.shieldUrl && (
                      <ImageWithLoading
                        src={
                          teams.find((t) => t.id === awayTeamId)?.shieldUrl ||
                          null
                        }
                        alt={teams.find((t) => t.id === awayTeamId)?.name || ""}
                        className="w-10 h-10 object-cover rounded"
                        size="sm"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {teams.find((t) => t.id === awayTeamId)?.name}
                    </span>
                  </div>
                </div>
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
            onClick={(e) => {
              e.preventDefault();
              const form = document.querySelector("form");
              form?.requestSubmit();
            }}
            disabled={isSubmitting || !homeTeamId || !awayTeamId}
            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isSubmitting ? "Criando..." : "Criar Partida"}
          </button>
        </div>
      </div>
    </div>
  );
};
