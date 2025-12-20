/**
 * Armazenamento global de arquivos dos jogadores
 * Fora do estado React para evitar perda de objetos File
 */

const playerFilesMap = new Map<string, File>();

export function setPlayerFile(playerId: string, file: File | null): void {
  if (file) {
    playerFilesMap.set(playerId, file);
    console.log(`[playerFilesStore] Arquivo salvo para ${playerId}:`, {
      fileName: file.name,
      fileSize: file.size,
    });
  } else {
    playerFilesMap.delete(playerId);
  }
}

export function getPlayerFile(playerId: string): File | undefined {
  return playerFilesMap.get(playerId);
}

export function hasPlayerFile(playerId: string): boolean {
  return playerFilesMap.has(playerId);
}

export function clearPlayerFiles(): void {
  playerFilesMap.clear();
  console.log("[playerFilesStore] Todos os arquivos foram limpos");
}

export function getAllPlayerFiles(): Map<string, File> {
  return new Map(playerFilesMap);
}
