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

    // Log detalhado: listar todas as chaves do FormData
    console.log("[API] FormData recebido - listando todas as chaves:");
    const formDataEntries: Array<{ key: string; type: string; size?: number }> =
      [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        formDataEntries.push({
          key,
          type: "File",
          size: value.size,
        });
      } else {
        formDataEntries.push({
          key,
          type: typeof value,
        });
      }
    }
    console.log("[API] Chaves do FormData:", formDataEntries);

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

    // Verificar todas as chaves photo_*
    console.log("[API] Verificando chaves photo_*:");
    for (let i = 0; i < 10; i++) {
      const photoKey = `photo_${i}`;
      const photoValue = formData.get(photoKey);
      if (photoValue) {
        console.log(`[API] ${photoKey} encontrado:`, {
          type: photoValue instanceof File ? "File" : typeof photoValue,
          size: photoValue instanceof File ? photoValue.size : undefined,
          name: photoValue instanceof File ? photoValue.name : undefined,
        });
      }
    }

    for (let i = 0; i < playerCount; i++) {
      const name = formData.get(`players[${i}][name]`) as string;
      const rg = formData.get(`players[${i}][rg]`) as string;

      // Log de debug antes de ler o arquivo
      console.log(`[API] Tentando ler photo_${i}...`);
      const photoFile = formData.get(`photo_${i}`) as File | null;
      console.log(`[API] Resultado de photo_${i}:`, {
        found: !!photoFile,
        type: photoFile instanceof File ? "File" : typeof photoFile,
        size: photoFile instanceof File ? photoFile.size : undefined,
        name: photoFile instanceof File ? photoFile.name : undefined,
      });

      console.log(`[API] Jogador ${i}:`, {
        name,
        rg,
        hasPhotoFile: !!photoFile,
        photoFileType: photoFile?.type,
        photoFileSize: photoFile?.size,
        photoFileName: photoFile?.name,
      });

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
        console.log(
          `[API] Iniciando upload da foto do jogador ${playerData.name}:`,
          {
            fileName: playerData.photoFile.name,
            fileSize: playerData.photoFile.size,
            fileType: playerData.photoFile.type,
          }
        );
        try {
          photoUrl = await uploadImage(playerData.photoFile, "players");
          console.log(
            `[API] Foto do jogador ${playerData.name} enviada:`,
            photoUrl
          );
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
