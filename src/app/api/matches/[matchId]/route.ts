import { NextResponse } from 'next/server';
import { getMatch } from '@/lib/actions/match-events';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const match = await getMatch(matchId);

    if (!match) {
      return NextResponse.json(
        { error: 'Partida não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar partida' },
      { status: 500 }
    );
  }
}
