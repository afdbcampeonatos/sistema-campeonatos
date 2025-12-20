import { updateChampionshipStatuses } from '@/lib/championship-status';
import { NextResponse } from 'next/server';

/**
 * Endpoint para atualizar o status dos campeonatos baseado nas datas
 * Pode ser chamado por um cron job ou manualmente
 */
export async function POST(request: Request) {
  try {
    // Verificar se há uma chave de autenticação (opcional, para segurança)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'afdb-cron-secret';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await updateChampionshipStatuses();

    return NextResponse.json({ 
      success: true,
      message: 'Status dos campeonatos atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status dos campeonatos:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}

// Permitir GET também para facilitar testes
export async function GET() {
  try {
    await updateChampionshipStatuses();
    return NextResponse.json({ 
      success: true,
      message: 'Status dos campeonatos atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status dos campeonatos:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}

