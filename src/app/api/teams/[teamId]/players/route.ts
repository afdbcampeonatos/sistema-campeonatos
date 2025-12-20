import { unmaskRG, validateRG } from "@/lib/masks";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const formData = await request.formData();
    const { teamId } = await params;

    // Validar se o time existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      );
    }

    // Extrair dados dos jogadores do FormData
    const playersData: Array<{
      name: string;
      rg: string;
      photoFile: File | null;
    }> = [];

    // FormData será enviado como: players[0][name], players[0][rg], photo_0
    const playerCount = parseInt(formData.get("playerCount") as string) || 0;

    for (let i = 0; i < playerCount; i++) {
      const name = formData.get(`players[${i}][name]`) as string;
      const rg = formData.get(`players[${i}][rg]`) as string;
      const photoFile = formData.get(`photo_${i}`) as File | null;

      if (name && rg) {
        // Remover máscara do RG e validar
        const cleanRG = unmaskRG(rg);

        if (!validateRG(cleanRG)) {
          return NextResponse.json(
            {
              error: `RG inválido para o jogador ${
                name || `#${i + 1}`
              }. O RG deve conter entre 7 e 9 dígitos.`,
            },
            { status: 400 }
          );
        }

        playersData.push({
          name,
          rg: cleanRG, // Salvar sem máscara
          photoFile: photoFile && photoFile.size > 0 ? photoFile : null,
        });
      }
    }

    // Processar cada jogador
    const playerPromises = playersData.map(async (playerData) => {
      let photoUrl: string | null = null;

      // Upload da foto do jogador (se fornecido)
      if (playerData.photoFile) {
        try {
          photoUrl = await uploadImage(playerData.photoFile, "players");
        } catch (error) {
          console.error(
            `Erro ao fazer upload da foto do jogador ${playerData.name}:`,
            error
          );
          // Retornar erro ao invés de continuar silenciosamente
          throw new Error(
            `Erro ao fazer upload da foto do jogador ${playerData.name}: ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`
          );
        }
      }

      return prisma.player.create({
        data: {
          teamId,
          name: playerData.name.trim(),
          rg: playerData.rg.trim(), // Já está sem máscara após validação
          photoUrl,
        },
      });
    });

    await Promise.all(playerPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao criar jogadores:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar jogadores. Verifique os logs do servidor para mais detalhes.",
      },
      { status: 500 }
    );
  }
}
