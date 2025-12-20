"use client";

import { deleteChampionship } from "@/app/actions/championships";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { useState } from "react";
import { FaEdit, FaExternalLinkAlt, FaTrash, FaTrophy } from "react-icons/fa";
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
};

const statusLabels: Record<string, string> = {
  OPEN: "Aberto",
  CLOSED: "Encerrado",
  DRAFT: "Rascunho",
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
        "Tem certeza que deseja excluir este campeonato? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteChampionship(id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Campeonato excluído com sucesso!");
      window.location.reload();
    } else {
      toast.error(result.error || "Erro ao excluir campeonato");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Todos os Campeonatos ({championships.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criado em
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {championships.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Nenhum campeonato encontrado
                </td>
              </tr>
            ) : (
              championships.map((championship) => (
                <tr
                  key={championship.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {championship.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[championship.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[championship.status] || championship.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {formatDate(championship.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
