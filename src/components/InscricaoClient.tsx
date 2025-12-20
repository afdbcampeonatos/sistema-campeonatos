"use client";

import { createTeam } from "@/app/actions/teams";
import { ChampionshipContextCard } from "@/components/ChampionshipContextCard";
import { Player, PlayerForm } from "@/components/PlayerForm";
import { PublicHeader } from "@/components/PublicHeader";
import { isRegistrationOpen } from "@/lib/championship-status";
import { optimizeImage, validateImage } from "@/lib/image-optimizer";
import { maskCPF, maskPhone, unmaskCPF, validateCPF } from "@/lib/masks";
import {
  clearPlayerFiles,
  getPlayerFile,
  hasPlayerFile,
} from "@/lib/player-files-store";
import { FormEvent, useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaUpload,
} from "react-icons/fa";

interface ChampionshipData {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  registrationStart: string | null;
  registrationEnd: string | null;
}

interface InscricaoClientProps {
  initialChampionshipData: ChampionshipData;
}

export const InscricaoClient = ({
  initialChampionshipData,
}: InscricaoClientProps) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    responsibleName: "",
    responsibleCpf: "",
    phone: "",
    shield: null as File | null,
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [shieldPreview, setShieldPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [championshipData] = useState<ChampionshipData>(
    initialChampionshipData
  );

  // Função para verificar se as inscrições estão abertas
  const isRegistrationOpenCheck = () => {
    return isRegistrationOpen({
      status: championshipData.status as "OPEN" | "CLOSED" | "DRAFT",
      registrationStart: championshipData.registrationStart
        ? new Date(championshipData.registrationStart)
        : null,
      registrationEnd: championshipData.registrationEnd
        ? new Date(championshipData.registrationEnd)
        : null,
    });
  };

  // Função para obter o status das inscrições
  const getRegistrationStatus = (): "abertas" | "encerradas" | "em-analise" => {
    if (!isRegistrationOpenCheck()) {
      if (championshipData.status !== "OPEN") {
        return "encerradas";
      }
      if (
        championshipData.registrationStart &&
        new Date() < new Date(championshipData.registrationStart)
      ) {
        return "em-analise";
      }
      if (
        championshipData.registrationEnd &&
        new Date() > new Date(championshipData.registrationEnd)
      ) {
        return "encerradas";
      }
      return "encerradas";
    }
    return "abertas";
  };

  // Preencher categoria automaticamente
  useEffect(() => {
    if (championshipData) {
      setFormData((prev) => ({
        ...prev,
        category: championshipData.category,
      }));
    }
  }, [championshipData]);

  // Limpar arquivos do store quando componente desmontar ou após sucesso
  useEffect(() => {
    return () => {
      // Limpar apenas se não for sucesso (para manter arquivos durante o submit)
      if (!isSuccess) {
        // Não limpar aqui, apenas após sucesso
      }
    };
  }, [isSuccess]);

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;

    // Aplicar máscaras
    if (field === "phone") {
      processedValue = maskPhone(value);
    } else if (field === "responsibleCpf") {
      processedValue = maskCPF(value);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleShieldChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar imagem
    const validation = await validateImage(file);
    if (!validation.valid) {
      setErrors((prev) => ({
        ...prev,
        shield: validation.error || "Imagem inválida",
      }));
      return;
    }

    // Otimizar imagem
    try {
      const optimized = await optimizeImage(file);
      const optimizedFile = optimized.file;

      setFormData((prev) => ({ ...prev, shield: optimizedFile }));
      setShieldPreview(optimized.preview);
      if (errors.shield) {
        setErrors((prev) => {
          const { shield: _, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error("Erro ao otimizar imagem:", error);
      setErrors((prev) => ({ ...prev, shield: "Erro ao processar imagem" }));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não definido";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validação
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do time é obrigatório";
    }

    if (!formData.category) {
      newErrors.category = "Categoria é obrigatória";
    }

    if (!formData.responsibleName.trim()) {
      newErrors.responsibleName = "Nome do responsável é obrigatório";
    }

    if (!formData.responsibleCpf.trim()) {
      newErrors.responsibleCpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.responsibleCpf)) {
      newErrors.responsibleCpf = "CPF inválido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    }

    if (!formData.shield) {
      newErrors.shield = "Escudo é obrigatório";
    }

    if (players.length === 0) {
      newErrors.players = "Adicione pelo menos um jogador";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Criar FormData
      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("category", formData.category);
      submitFormData.append("responsibleName", formData.responsibleName);
      submitFormData.append(
        "responsibleCpf",
        unmaskCPF(formData.responsibleCpf)
      );
      submitFormData.append("phone", formData.phone);
      if (formData.shield) {
        submitFormData.append("shield", formData.shield);
      }

      // Criar time
      const teamResult = await createTeam(championshipData.id, submitFormData);

      if (!teamResult.success) {
        setErrors({ submit: teamResult.error || "Erro ao criar time" });
        setIsSubmitting(false);
        return;
      }

      // Criar jogadores (se houver)
      if (players.length > 0 && teamResult.data?.id) {
        // Verificar se todos os jogadores têm fotos antes de começar
        const playersWithoutPhotos = players.filter(
          (p) => !p.photoFile && !hasPlayerFile(p.id)
        );

        if (playersWithoutPhotos.length > 0) {
          setErrors({
            submit: `Erro: ${playersWithoutPhotos.length} jogador(es) não possui(em) foto. Por favor, adicione fotos para todos os jogadores antes de enviar.`,
          });
          setIsSubmitting(false);
          return;
        }

        const playersFormData = new FormData();
        let filesAddedCount = 0;
        playersFormData.append("playerCount", players.length.toString());
        players.forEach((player, index) => {
          playersFormData.append(`players[${index}][name]`, player.name);
          playersFormData.append(`players[${index}][rg]`, player.rg);

          // Tentar usar arquivo do estado primeiro, depois do store global
          let photoFile =
            player.photoFile && player.photoFile instanceof File
              ? player.photoFile
              : getPlayerFile(player.id);

          // Tentar adicionar arquivo (File já é um Blob, então podemos usar diretamente)
          if (photoFile) {
            try {
              // File extends Blob, então podemos usar diretamente
              playersFormData.append(`photo_${index}`, photoFile);
              filesAddedCount++;
            } catch (error) {
              console.error("Erro ao adicionar arquivo ao FormData:", error);
            }
          }
        });

        // Validar se todos os arquivos foram adicionados
        const expectedFilesCount = players.length;
        if (filesAddedCount < expectedFilesCount) {
          const missingFilesCount = expectedFilesCount - filesAddedCount;
          setErrors({
            submit: `Erro: ${missingFilesCount} jogador(es) não possui(em) foto. Por favor, adicione fotos para todos os jogadores antes de enviar.`,
          });
          setIsSubmitting(false);
          return;
        }

        const playersResponse = await fetch(
          `/api/teams/${teamResult.data.id}/players`,
          {
            method: "POST",
            body: playersFormData,
          }
        );

        if (!playersResponse.ok) {
          const errorData = await playersResponse.json();
          console.error("Erro ao criar jogadores:", errorData);
          setErrors({
            submit:
              errorData.error || "Erro ao criar jogadores. Tente novamente.",
          });
          setIsSubmitting(false);
          return;
        }

        // Verificar se a resposta indica sucesso real
        const responseData = await playersResponse.json();
        if (!responseData.success) {
          setErrors({
            submit:
              responseData.error ||
              "Erro ao criar jogadores. Verifique se todas as fotos foram enviadas.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      setIsSuccess(true);
      setIsSubmitting(false);

      // Limpar arquivos do store após sucesso
      clearPlayerFiles();
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      setErrors({ submit: "Erro ao enviar formulário. Tente novamente." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Título da Página */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {championshipData ? (
              <>
                Inscrição para {championshipData.name}
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {championshipData.category}
                </span>
              </>
            ) : (
              "Inscrição para o Campeonato"
            )}
          </h1>
          <p className="text-gray-600 mt-2">
            Preencha o formulário abaixo para inscrever sua equipe
          </p>
        </div>

        {!isRegistrationOpenCheck() ? (
          <>
            {/* Card de Contexto do Campeonato */}
            <ChampionshipContextCard
              nome={championshipData.name}
              dataInicio={formatDate(championshipData.registrationStart)}
              dataFim={formatDate(championshipData.registrationEnd)}
              status={getRegistrationStatus()}
            />

            {/* Mensagem de Inscrições Encerradas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-6 text-center">
              <FaExclamationTriangle className="text-6xl text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Inscrições Encerradas
              </h2>
              <p className="text-gray-600 mb-4">
                {championshipData.status !== "OPEN"
                  ? "Este campeonato não está aceitando inscrições no momento."
                  : championshipData.registrationStart &&
                    new Date() < new Date(championshipData.registrationStart)
                  ? `As inscrições começam em ${formatDate(
                      championshipData.registrationStart
                    )}.`
                  : championshipData.registrationEnd &&
                    new Date() > new Date(championshipData.registrationEnd)
                  ? `As inscrições foram encerradas em ${formatDate(
                      championshipData.registrationEnd
                    )}.`
                  : "As inscrições não estão abertas no momento."}
              </p>
              <p className="text-sm text-gray-500">
                Para mais informações, entre em contato com a organização do
                campeonato.
              </p>
            </div>
          </>
        ) : isSuccess ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Inscrição Enviada!
            </h2>
            <p className="text-gray-600 mb-4">
              Sua inscrição foi enviada com sucesso e está aguardando análise.
            </p>
            <p className="text-sm text-gray-500">
              Você receberá uma confirmação em breve.
            </p>
          </div>
        ) : (
          <>
            {/* Card de Contexto do Campeonato */}
            <ChampionshipContextCard
              nome={championshipData.name}
              dataInicio={formatDate(championshipData.registrationStart)}
              dataFim={formatDate(championshipData.registrationEnd)}
              status={getRegistrationStatus()}
            />

            {/* Formulário de Inscrição */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Dados da Equipe
              </h2>

              {errors.submit && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome do Time */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nome do Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Digite o nome do time"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Categoria (exibida, não editável) */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-gray-100 cursor-not-allowed ${
                      errors.category ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={true}
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value={championshipData.category}>
                      {championshipData.category}
                    </option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Nome do Responsável/Técnico */}
                <div>
                  <label
                    htmlFor="responsibleName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nome do Responsável/Técnico{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="responsibleName"
                    value={formData.responsibleName}
                    onChange={(e) =>
                      handleInputChange("responsibleName", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      errors.responsibleName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Digite o nome completo do responsável/técnico"
                  />
                  {errors.responsibleName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.responsibleName}
                    </p>
                  )}
                </div>

                {/* CPF do Responsável */}
                <div>
                  <label
                    htmlFor="responsibleCpf"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    CPF do Responsável <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="responsibleCpf"
                    value={formData.responsibleCpf}
                    onChange={(e) =>
                      handleInputChange("responsibleCpf", e.target.value)
                    }
                    maxLength={14}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      errors.responsibleCpf
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="000.000.000-00"
                  />
                  {errors.responsibleCpf && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.responsibleCpf}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Necessário para processamento de pagamento
                  </p>
                </div>

                {/* WhatsApp/Telefone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    WhatsApp/Telefone para Contato{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    maxLength={15}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="(00) 00000-0000"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                {/* Upload de Escudo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload de Escudo <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <label
                      htmlFor="shield"
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        errors.shield ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      {shieldPreview ? (
                        <div className="relative w-full h-full p-4">
                          <img
                            src={shieldPreview}
                            alt="Preview do escudo"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FaUpload className="text-4xl text-gray-400 mb-4" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">
                              Clique para fazer upload
                            </span>{" "}
                            ou arraste e solte
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG ou GIF (máx. 10MB - será otimizado
                            automaticamente)
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        id="shield"
                        accept="image/*"
                        onChange={handleShieldChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {errors.shield && (
                    <p className="mt-1 text-sm text-red-600">{errors.shield}</p>
                  )}
                </div>

                {/* Cadastro de Jogadores */}
                <div className="pt-6 border-t border-gray-200">
                  <PlayerForm
                    players={players}
                    onChange={setPlayers}
                    errors={errors}
                  />
                  {errors.players && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.players}
                    </p>
                  )}
                </div>

                {/* Botão de Submissão */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isRegistrationOpenCheck()}
                    className="w-full bg-blue-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Confirmar Inscrição"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
