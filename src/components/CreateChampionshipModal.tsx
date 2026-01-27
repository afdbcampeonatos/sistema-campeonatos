"use client";

import { createChampionship } from "@/app/actions/championships";
import { useToast } from "@/contexts/ToastContext";
import { generateSlug } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { DateTimePicker } from "./DateTimePicker";
import { LoadingSpinner } from "./LoadingSpinner";

interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface CreateChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export const CreateChampionshipModal = ({
  isOpen,
  onClose,
  categories,
}: CreateChampionshipModalProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [generatedSlug, setGeneratedSlug] = useState("");
  const [registrationStart, setRegistrationStart] = useState<Date | null>(null);
  const [registrationEnd, setRegistrationEnd] = useState<Date | null>(null);
  const [registrationFee, setRegistrationFee] = useState("");

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Guardar referência do formulário antes do await
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Adicionar datas ao FormData se existirem
    if (registrationStart) {
      formData.set("registrationStart", registrationStart.toISOString());
    }
    if (registrationEnd) {
      formData.set("registrationEnd", registrationEnd.toISOString());
    }

    try {
      const result = await createChampionship(formData);

      if (result.success) {
        // Resetar formulário apenas se ainda existir
        if (form) {
          form.reset();
        }
        // Resetar estados de data
        setRegistrationStart(null);
        setRegistrationEnd(null);
        setRegistrationFee("");
        // Manter loading por mais um momento para mostrar feedback visual
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Fechar modal e mostrar toast
        setIsSubmitting(false);
        toast.success("Campeonato criado com sucesso!");
        onClose();
      } else {
        setIsSubmitting(false);
        const errorMessage = result.error || "Erro ao criar campeonato";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating championship:", error);
      setIsSubmitting(false);
      const errorMessage = "Erro inesperado ao criar campeonato";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setName("");
      setSelectedCategory("");
      setGeneratedSlug("");
      setRegistrationFee("");
      // Resetar formulário ao fechar
      setFormKey((prev) => prev + 1);
      onClose();
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    updateSlug(newName, selectedCategory);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    updateSlug(name, newCategory);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite apenas números e vírgula/ponto
    const value = e.target.value.replace(/[^0-9.,]/g, "");
    setRegistrationFee(value);
  };

  const updateSlug = (championshipName: string, category: string) => {
    if (championshipName && category) {
      const nameSlug = generateSlug(championshipName);
      const categorySlug = generateSlug(category);
      setGeneratedSlug(`${nameSlug}-${categorySlug}`);
    } else {
      setGeneratedSlug("");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center z-9999 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp relative"
        style={{ overflowX: "visible" }}
      >
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-700 font-medium">Criando campeonato...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Novo Campeonato</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form key={formKey} onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nome do Campeonato <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleNameChange}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Ex: Campeonato Nacional 2024"
            />
          </div>

          {/* Slug (gerado automaticamente) */}
          {generatedSlug && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL do Campeonato (gerada automaticamente)
              </label>
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600">
                /campeonatos/{generatedSlug}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                A URL será gerada automaticamente usando o slug do campeonato.
              </p>
            </div>
          )}

          {/* Categoria */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              disabled={isSubmitting}
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Selecione uma categoria</option>
              {categories.length === 0 ? (
                <option value="" disabled>
                  Nenhuma categoria disponível
                </option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
            {categories.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Configure categorias em Configurações antes de criar um
                campeonato
              </p>
            )}
          </div>

          {/* Data de Início das Inscrições */}
          <div>
            <label
              htmlFor="registrationStart"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Data de Início das Inscrições
            </label>
            <DateTimePicker
              value={registrationStart}
              onChange={setRegistrationStart}
              placeholder="Selecione data e hora de início"
              disabled={isSubmitting}
              minDate={new Date()}
            />
            <p className="mt-1 text-xs text-gray-500">
              Opcional: Defina quando as inscrições começam
            </p>
          </div>

          {/* Data de Fim das Inscrições */}
          <div>
            <label
              htmlFor="registrationEnd"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Data de Fim das Inscrições
            </label>
            <DateTimePicker
              value={registrationEnd}
              onChange={setRegistrationEnd}
              placeholder="Selecione data e hora de fim"
              disabled={isSubmitting}
              minDate={registrationStart || new Date()}
            />
            <p className="mt-1 text-xs text-gray-500">
              Opcional: Defina quando as inscrições terminam
            </p>
          </div>

          {/* Taxa de Inscrição */}
          <div>
            <label
              htmlFor="registrationFee"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Taxa de Inscrição (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                R$
              </span>
              <input
                type="text"
                id="registrationFee"
                name="registrationFee"
                value={registrationFee}
                onChange={handleFeeChange}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="0,00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Opcional: Deixe em branco para inscrições gratuitas
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Campeonato"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
