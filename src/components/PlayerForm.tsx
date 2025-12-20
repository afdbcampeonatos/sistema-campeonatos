"use client";

import { optimizeImage, validateImage } from "@/lib/image-optimizer";
import { maskRG, unmaskRG, validateRG } from "@/lib/masks";
import { setPlayerFile } from "@/lib/player-files-store";
import { useState } from "react";
import { FaPlus, FaTrash, FaUpload } from "react-icons/fa";

export interface Player {
  id: string;
  name: string;
  rg: string;
  photoFile: File | null;
  photoPreview: string | null;
}

interface PlayerFormProps {
  players: Player[];
  onChange: (players: Player[]) => void;
  errors?: Record<string, string>;
}

export const PlayerForm = ({ players, onChange, errors }: PlayerFormProps) => {
  // Estado local para erros de RG
  const [rgErrors, setRgErrors] = useState<Record<string, string>>({});

  const addPlayer = () => {
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random()}`,
      name: "",
      rg: "",
      photoFile: null,
      photoPreview: null,
    };
    onChange([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    onChange(players.filter((p) => p.id !== id));
  };

  const updatePlayer = (
    id: string,
    field: keyof Player,
    value: string | File | null
  ) => {
    onChange(
      players.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handlePhotoChange = async (playerId: string, file: File | null) => {
    if (!file) {
      updatePlayer(playerId, "photoFile", null);
      updatePlayer(playerId, "photoPreview", null);
      setPlayerFile(playerId, null); // Limpar do store também
      return;
    }

    // Validar imagem
    const validation = validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      // Otimizar imagem
      const optimized = await optimizeImage(file, 400, 400, 0.8);
      console.log(`[PlayerForm] Foto otimizada para ${playerId}:`, {
        originalSize: file.size,
        optimizedSize: optimized.file.size,
        fileName: optimized.file.name,
        fileType: optimized.file.type,
      });
      updatePlayer(playerId, "photoFile", optimized.file);
      updatePlayer(playerId, "photoPreview", optimized.preview);

      // Salvar no store global (fora do estado React)
      setPlayerFile(playerId, optimized.file);

      // Adicionar log para verificar se foi atualizado
      console.warn(`[PlayerForm] Arquivo atualizado para ${playerId}:`, {
        hasFile: !!optimized.file,
        fileSize: optimized.file.size,
        fileName: optimized.file.name,
      });
    } catch (error) {
      console.error("Erro ao otimizar imagem:", error);
      alert("Erro ao processar imagem. Tente novamente.");
    }
  };

  const handleRGChange = (playerId: string, value: string) => {
    // Remove máscara antes de salvar no estado
    const rawValue = unmaskRG(value);
    updatePlayer(playerId, "rg", rawValue);

    // Limpar erro ao digitar
    if (rgErrors[playerId]) {
      setRgErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[playerId];
        return newErrors;
      });
    }
  };

  const handleRGBlur = (playerId: string, value: string) => {
    // Validar RG quando o campo perde o foco
    const rawValue = unmaskRG(value);

    if (rawValue && !validateRG(rawValue)) {
      setRgErrors((prev) => ({
        ...prev,
        [playerId]: "RG inválido. Deve conter entre 7 e 9 dígitos.",
      }));
    } else {
      setRgErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[playerId];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Jogadores <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={addPlayer}
          className="flex items-center gap-2 text-sm text-blue-900 hover:text-blue-800 font-medium"
        >
          <FaPlus />
          Adicionar Jogador
        </button>
      </div>

      {players.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">Nenhum jogador adicionado</p>
          <button
            type="button"
            onClick={addPlayer}
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <FaPlus />
            Adicionar Primeiro Jogador
          </button>
        </div>
      )}

      <div className="space-y-4">
        {players.map((player, index) => (
          <div
            key={player.id}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-900">
                Jogador {index + 1}
              </h4>
              {players.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlayer(player.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Remover jogador"
                >
                  <FaTrash />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) =>
                    updatePlayer(player.id, "name", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                    errors?.[`player-${player.id}-name`]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Nome completo do jogador"
                />
                {errors?.[`player-${player.id}-name`] && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[`player-${player.id}-name`]}
                  </p>
                )}
              </div>

              {/* RG */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RG <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={maskRG(player.rg)}
                  onChange={(e) => handleRGChange(player.id, e.target.value)}
                  onBlur={(e) => handleRGBlur(player.id, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                    errors?.[`player-${player.id}-rg`] || rgErrors[player.id]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="00.000.000-0"
                />
                {(errors?.[`player-${player.id}-rg`] ||
                  rgErrors[player.id]) && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors?.[`player-${player.id}-rg`] || rgErrors[player.id]}
                  </p>
                )}
              </div>

              {/* Foto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto do Jogador <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  {player.photoPreview ? (
                    <div className="relative">
                      <img
                        src={player.photoPreview}
                        alt={`Foto de ${player.name || "jogador"}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FaUpload className="text-gray-400" />
                    </div>
                  )}
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handlePhotoChange(player.id, file);
                      }}
                      className="hidden"
                    />
                    <div className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      <FaUpload />
                      {player.photoPreview ? "Alterar Foto" : "Selecionar Foto"}
                    </div>
                  </label>
                </div>
                {errors?.[`player-${player.id}-photo`] && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[`player-${player.id}-photo`]}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  A imagem será otimizada automaticamente
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {players.length > 0 && players.length < 15 && (
        <p className="text-sm text-amber-600">
          Recomendamos cadastrar entre 15 e 18 jogadores
        </p>
      )}
    </div>
  );
};
