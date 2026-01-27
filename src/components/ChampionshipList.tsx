"use client";

import { deleteChampionship, finishChampionship } from "@/app/actions/championships";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { useState } from "react";
import { FaCheck, FaEdit, FaExternalLinkAlt, FaTrash, FaTrophy } from "react-icons/fa";
import { EditChampionshipModal } from "./EditChampionshipModal";

interface Championship {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface ChampionshipListProps {
  championships: Championship[];
  categories: Category[];
  onViewChampionship?: (championshipSlug: string) => void;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  DRAFT: "bg-blue-100 text-blue-800",
  FINISHED: "bg-purple-100 text-purple-800",
};

const statusLabels: Record<string, string> = {
  OPEN: "Aberto",
  CLOSED: "Encerrado",
  DRAFT: "Rascunho",
  FINISHED: "Finalizado",
};

export const ChampionshipList = ({
  championships,
  categories,
  onViewChampionship,
}: ChampionshipListProps) => {
  const toast = useToast();
  const [editingChampionship, setEditingChampionship] =
    useState<Championship | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este campeonato? Todos os times, jogadores e fotos serão removidos permanentemente. Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteChampionship(id);
    setIsDeleting(false);

    if (result.success) {
      const stats = result.data;
      toast.success(
        `Campeonato excluído! ${stats?.deletedTeams || 0} time(s) e ${stats?.deletedPhotos || 0} foto(s) removidos.`
      );
      window.location.reload();
    } else {
      toast.error(result.error || "Erro ao excluir campeonato");
    }
  };

  const handleFinish = async (id: string, name: string) => {
    if (
      !confirm(
        `Tem certeza que deseja finalizar o campeonato "${name}"? Todas as fotos de times e jogadores serão deletadas para liberar espaço. Os dados do campeonato serão mantidos para histórico.`
      )
    ) {
      return;
    }

    setIsFinishing(true);
    const result = await finishChampionship(id);
    setIsFinishing(false);

    if (result.success) {
      toast.success(
        `Campeonato finalizado! ${result.data?.deletedPhotos || 0} foto(s) removidas.`
      );
      window.location.reload();
    } else {
      toast.error(result.error || "Erro ao finalizar campeonato");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Todos os Campeonatos ({championships.length})
        </h2>
      </div>

      {/* Mobile: Cards Layout */}
      {championships.length === 0 ? (
        <div className="md:hidden p-8 text-center text-gray-500">
          Nenhum campeonato encontrado
        </div>
      ) : (
        <div className="md:hidden p-4 space-y-4">
          {championships.map((championship) => (
            <div
              key={championship.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              {/* Header com nome e ações */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <FaTrophy className="text-blue-900 text-lg shrink-0" />
                  {onViewChampionship ? (
                    <button
                      onClick={() => onViewChampionship(championship.slug)}
                      className="text-left"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 hover:text-blue-900 transition-colors">
                        {championship.name}
                      </h3>
                    </button>
                  ) : (
                    <Link
                      href={`/campeonatos/${championship.slug}`}
                      target="_blank"
                      className="text-left"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 hover:text-blue-900 transition-colors">
                        {championship.name}
                      </h3>
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    href={`/campeonatos/${championship.slug}`}
                    target="_blank"
                    className="text-green-600 hover:text-green-900 transition-colors p-2"
                    title="Ver página de inscrição"
                  >
                    <FaExternalLinkAlt className="text-lg" />
                  </Link>
                  <button
                    onClick={() => setEditingChampionship(championship)}
                    className="text-gray-600 hover:text-gray-900 transition-colors p-2"
                    title="Editar"
                  >
                    <FaEdit className="text-lg" />
                  </button>
                  {championship.status !== "FINISHED" && (
                    <button
                      onClick={() => handleFinish(championship.id, championship.name)}
                      disabled={isFinishing}
                      className="text-purple-600 hover:text-purple-900 transition-colors disabled:opacity-50 p-2"
                      title="Finalizar campeonato"
                    >
                      <FaCheck className="text-lg" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(championship.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 p-2"
                    title="Excluir"
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Categoria</span>
                  <span className="text-sm font-medium text-gray-900">
                    {championship.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      statusColors[championship.status] ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabels[championship.status] || championship.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Criado em</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(championship.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop: Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criado em
              </th>
              <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {championships.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 md:px-6 py-8 text-center text-gray-500">
                  Nenhum campeonato encontrado
                </td>
              </tr>
            ) : (
              championships.map((championship) => (
                <tr
                  key={championship.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    {onViewChampionship ? (
                      <button
                        onClick={() => onViewChampionship(championship.slug)}
                        className="flex items-center gap-2 group"
                      >
                        <FaTrophy className="text-blue-900" />
                        <span className="text-sm font-medium text-gray-900 group-hover:text-blue-900 transition-colors cursor-pointer">
                          {championship.name}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={`/campeonatos/${championship.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 group"
                      >
                        <FaTrophy className="text-blue-900" />
                        <span className="text-sm font-medium text-gray-900 group-hover:text-blue-900 transition-colors cursor-pointer">
                          {championship.name}
                        </span>
                      </Link>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {championship.category}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[championship.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[championship.status] || championship.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {formatDate(championship.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/campeonatos/${championship.slug}`}
                        target="_blank"
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Ver página de inscrição"
                      >
                        <FaExternalLinkAlt />
                      </Link>
                      <button
                        onClick={() => setEditingChampionship(championship)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      {championship.status !== "FINISHED" && (
                        <button
                          onClick={() => handleFinish(championship.id, championship.name)}
                          disabled={isFinishing}
                          className="text-purple-600 hover:text-purple-900 transition-colors disabled:opacity-50"
                          title="Finalizar campeonato"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(championship.id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                        title="Excluir"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      <EditChampionshipModal
        isOpen={!!editingChampionship}
        onClose={() => setEditingChampionship(null)}
        championship={editingChampionship}
        categories={categories}
      />
    </div>
  );
};
