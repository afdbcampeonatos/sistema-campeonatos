'use client';

import { useState, FormEvent } from 'react';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
} from '@/app/actions/categories';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { LoadingSpinner } from './LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';

interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryManagerProps {
  initialCategories: Category[];
}

export const CategoryManager = ({ initialCategories }: CategoryManagerProps) => {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOpenModal = (category?: Category) => {
    setEditingCategory(category || null);
    setError(null);
    setSuccess(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setEditingCategory(null);
      setError(null);
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Guardar referência do formulário antes do await
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      let result;

      if (editingCategory) {
        result = await updateCategory(editingCategory.id, formData);
      } else {
        result = await createCategory(formData);
      }

      if (result.success) {
        // Resetar formulário apenas se ainda existir
        if (form) {
          form.reset();
        }
        
        // Manter loading por mais um momento para mostrar feedback visual
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Recarregar a página para atualizar a lista
        setIsSubmitting(false);
        toast.success(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
        window.location.reload();
      } else {
        setIsSubmitting(false);
        const errorMessage = result.error || 'Erro ao salvar categoria';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      setIsSubmitting(false);
      const errorMessage = 'Erro inesperado ao salvar categoria';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    const result = await deleteCategory(id);

    if (result.success) {
      toast.success('Categoria excluída com sucesso!');
      window.location.reload();
    } else {
      toast.error(result.error || 'Erro ao excluir categoria');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const result = await toggleCategoryActive(id, !currentActive);

    if (result.success) {
      toast.success(`Categoria ${!currentActive ? 'ativada' : 'desativada'} com sucesso!`);
      window.location.reload();
    } else {
      toast.error(result.error || 'Erro ao alterar status da categoria');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-blue-900 text-white px-4 py-3 md:py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium h-12 md:h-10"
          >
            <FaPlus />
            Nova Categoria
          </button>
        </div>

        {/* Mobile: Cards Layout */}
        {categories.length === 0 ? (
          <div className="md:hidden p-8 text-center text-gray-500">
            Nenhuma categoria cadastrada
          </div>
        ) : (
          <div className="md:hidden p-4 space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                {/* Header com nome e ações */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex-1">
                    {category.name}
                  </h3>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleOpenModal(category)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-2"
                      title="Editar"
                    >
                      <FaEdit className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900 transition-colors p-2"
                      title="Excluir"
                    >
                      <FaTrash className="text-lg" />
                    </button>
                  </div>
                </div>

                {/* Informações */}
                <div className="space-y-2">
                  {category.description && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-gray-500">Descrição</span>
                      <span className="text-sm text-gray-600 text-right flex-1 ml-2">
                        {category.description}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <button
                      onClick={() => handleToggleActive(category.id, category.active)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors h-12 md:h-auto ${
                        category.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {category.active ? 'Ativa' : 'Inativa'}
                    </button>
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
                  Descrição
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 md:px-6 py-8 text-center text-gray-500">
                    Nenhuma categoria cadastrada
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {category.name}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className="text-sm text-gray-600">
                        {category.description || '-'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(category.id, category.active)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                          category.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {category.active ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-slideUp relative">
            {/* Loading Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-700 font-medium">
                    {editingCategory ? 'Atualizando categoria...' : 'Criando categoria...'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  Categoria {editingCategory ? 'atualizada' : 'criada'} com sucesso!
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  disabled={isSubmitting}
                  defaultValue={editingCategory?.name || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50"
                  placeholder="Ex: Amador"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  disabled={isSubmitting}
                  defaultValue={editingCategory?.description || ''}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50 resize-none"
                  placeholder="Ex: Atletas com idade entre 15 e 17 anos"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Opcional: Descreva a categoria (idade dos atletas, nível, etc.)
                </p>
              </div>

              {editingCategory && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="active"
                      value="true"
                      defaultChecked={editingCategory.active}
                      disabled={isSubmitting}
                      className="rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Categoria ativa
                    </span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

