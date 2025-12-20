/**
 * Funções utilitárias para gerar diferentes formatos de chaveamento de partidas
 */

export interface MatchToCreate {
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: Date | null;
}

/**
 * Gera partidas no formato Round Robin (todos contra todos)
 * @param teamIds Array de IDs dos times
 * @param returnMatch Se true, gera ida e volta (cada time joga em casa e fora)
 * @returns Array de partidas a serem criadas
 */
export function generateRoundRobin(
  teamIds: string[],
  returnMatch: boolean = false
): MatchToCreate[] {
  const matches: MatchToCreate[] = [];

  // Gerar todas as combinações possíveis
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      // Partida ida
      matches.push({
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
        scheduledAt: null,
      });

      // Partida volta (se solicitado)
      if (returnMatch) {
        matches.push({
          homeTeamId: teamIds[j],
          awayTeamId: teamIds[i],
          scheduledAt: null,
        });
      }
    }
  }

  return matches;
}

/**
 * Gera partidas no formato Mata-mata (eliminação simples)
 * @param teamIds Array de IDs dos times (deve ser potência de 2)
 * @param includeThirdPlace Se true, inclui partida de 3º lugar
 * @returns Array de partidas a serem criadas
 */
export function generateSingleElimination(
  teamIds: string[],
  includeThirdPlace: boolean = false
): MatchToCreate[] {
  const matches: MatchToCreate[] = [];

  // Verificar se é potência de 2
  const numTeams = teamIds.length;
  const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

  if (!isPowerOfTwo(numTeams)) {
    throw new Error(
      "Mata-mata requer número de times que seja potência de 2 (2, 4, 8, 16, etc.)"
    );
  }

  // Embaralhar times para evitar viés
  const shuffled = [...teamIds].sort(() => Math.random() - 0.5);

  // Para mata-mata, criamos apenas as partidas da primeira rodada
  // As partidas das próximas rodadas serão criadas depois, quando soubermos os vencedores
  for (let i = 0; i < shuffled.length; i += 2) {
    const homeTeam = shuffled[i];
    const awayTeam = shuffled[i + 1];

    matches.push({
      homeTeamId: homeTeam,
      awayTeamId: awayTeam,
      scheduledAt: null,
    });
  }

  // Nota: Partida de 3º lugar e próximas rodadas devem ser criadas manualmente
  // após a conclusão das rodadas anteriores, pois dependem dos resultados

  return matches;
}

/**
 * Gera partidas no formato Fase de Grupos + Mata-mata
 * @param teamIds Array de IDs dos times
 * @param numberOfGroups Número de grupos
 * @param teamsPerGroup Número de times por grupo
 * @returns Array de partidas a serem criadas
 */
export function generateGroupStage(
  teamIds: string[],
  numberOfGroups: number,
  teamsPerGroup: number
): MatchToCreate[] {
  const matches: MatchToCreate[] = [];

  // Validar
  if (numberOfGroups * teamsPerGroup !== teamIds.length) {
    throw new Error(
      `Número de grupos (${numberOfGroups}) × times por grupo (${teamsPerGroup}) deve ser igual ao número de times (${teamIds.length})`
    );
  }

  // Embaralhar times
  const shuffled = [...teamIds].sort(() => Math.random() - 0.5);

  // Dividir em grupos
  const groups: string[][] = [];
  for (let i = 0; i < numberOfGroups; i++) {
    groups.push([]);
  }

  shuffled.forEach((teamId, index) => {
    const groupIndex = index % numberOfGroups;
    groups[groupIndex].push(teamId);
  });

  // Gerar partidas dentro de cada grupo (Round Robin)
  groups.forEach((group) => {
    const groupMatches = generateRoundRobin(group, false);
    matches.push(...groupMatches);
  });

  // Nota: A fase mata-mata após os grupos seria gerada separadamente
  // após a conclusão da fase de grupos, baseada nos classificados

  return matches;
}

/**
 * Calcula o número de partidas para cada formato
 */
export function calculateMatchCount(
  format: "round-robin" | "single-elimination" | "group-stage",
  teamCount: number,
  options?: {
    roundRobinReturn?: boolean;
    numberOfGroups?: number;
    teamsPerGroup?: number;
  }
): number {
  switch (format) {
    case "round-robin":
      const singleRound = (teamCount * (teamCount - 1)) / 2;
      return options?.roundRobinReturn ? singleRound * 2 : singleRound;

    case "single-elimination":
      // Mata-mata: apenas primeira rodada (n/2 partidas)
      // Próximas rodadas devem ser criadas manualmente após resultados
      return Math.floor(teamCount / 2);

    case "group-stage":
      if (!options?.numberOfGroups || !options?.teamsPerGroup) {
        return 0;
      }
      // Round robin dentro de cada grupo
      const matchesPerGroup =
        (options.teamsPerGroup * (options.teamsPerGroup - 1)) / 2;
      return matchesPerGroup * options.numberOfGroups;

    default:
      return 0;
  }
}
