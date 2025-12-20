'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export interface CreateCategoryResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface UpdateCategoryResult {
  success: boolean;
  error?: string;
}

export interface DeleteCategoryResult {
  success: boolean;
  error?: string;
}

export async function createCategory(
  formData: FormData
): Promise<CreateCategoryResult> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;

    if (!name) {
      return {
        success: false,
        error: 'Nome é obrigatório',
      };
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        active: true,
      },
    });

    revalidatePath('/admin/configuracoes');

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.name, // Mantido para compatibilidade, mas não usado
      },
    };
  } catch (error: unknown) {
    console.error('Erro ao criar categoria:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        success: false,
        error: 'Já existe uma categoria com este nome. Por favor, escolha outro.',
      };
    }

    return {
      success: false,
      error: 'Erro ao criar categoria. Tente novamente.',
    };
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<UpdateCategoryResult> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const active = formData.get('active') === 'true';

    if (!name) {
      return {
        success: false,
        error: 'Nome é obrigatório',
      };
    }

    await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        active,
      },
    });

    revalidatePath('/admin/configuracoes');

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error('Erro ao atualizar categoria:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        success: false,
        error: 'Já existe uma categoria com este nome. Por favor, escolha outro.',
      };
    }

    return {
      success: false,
      error: 'Erro ao atualizar categoria. Tente novamente.',
    };
  }
}

export async function deleteCategory(
  id: string
): Promise<DeleteCategoryResult> {
  try {
    // Buscar a categoria para obter o nome
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return {
        success: false,
        error: 'Categoria não encontrada.',
      };
    }

    // Verificar se há campeonatos usando esta categoria (por nome)
    const championships = await prisma.championship.findFirst({
      where: { category: category.name },
    });

    if (championships) {
      return {
        success: false,
        error: 'Não é possível excluir esta categoria pois existem campeonatos associados a ela.',
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath('/admin/configuracoes');

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error('Erro ao excluir categoria:', error);

    return {
      success: false,
      error: 'Erro ao excluir categoria. Tente novamente.',
    };
  }
}

export async function toggleCategoryActive(
  id: string,
  active: boolean
): Promise<UpdateCategoryResult> {
  try {
    await prisma.category.update({
      where: { id },
      data: { active },
    });

    revalidatePath('/admin/configuracoes');

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error('Erro ao alterar status da categoria:', error);

    return {
      success: false,
      error: 'Erro ao alterar status da categoria. Tente novamente.',
    };
  }
}

