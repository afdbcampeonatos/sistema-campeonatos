'use server';

import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function changePassword(password: string) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: 'Não autorizado' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return { error: 'Erro ao alterar senha' };
  }
}
