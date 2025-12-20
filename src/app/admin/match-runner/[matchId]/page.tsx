import type { Match } from "@/core/domain/match";
import { getMatch } from "@/lib/actions/match-events";
import { notFound } from "next/navigation";
import { MatchRunnerClient } from "./_components/MatchRunnerClient";

interface PageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export default async function MatchRunnerPage({ params }: PageProps) {
  const { matchId } = await params;
  const matchData = await getMatch(matchId);

  if (!matchData) {
    notFound();
  }

  // Transform Prisma result to domain type
  const match: Match = {
    ...matchData,
    status: matchData.status as Match["status"],
    events: matchData.events.map((e) => ({
      ...e,
      type: e.type as Match["events"][0]["type"],
      metadata: e.metadata as Record<string, unknown> | null,
    })),
  };

  return <MatchRunnerClient initialMatch={match} />;
}
