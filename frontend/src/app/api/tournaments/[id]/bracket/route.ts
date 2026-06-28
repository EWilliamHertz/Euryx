import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/tournaments/[id]/bracket — generate a single-elim bracket from current registrations.
// Pads to next power-of-2 with BYEs. Idempotent.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const t = await prisma.euryxTournament.findUnique({
    where: { id: params.id },
    include: { registrations: true, matches: true },
  });
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (t.matches.length > 0) {
    return NextResponse.json({ ok: true, alreadyGenerated: true, rounds: roundsOf(t.matches) });
  }

  const players = t.registrations.map((r, i) => ({ id: r.userId, name: r.username, seed: i + 1 }));
  if (players.length < 2) return NextResponse.json({ error: "need ≥ 2 players" }, { status: 400 });

  // Pad to next power of 2 with BYE slots
  const size = Math.pow(2, Math.ceil(Math.log2(players.length)));
  while (players.length < size) players.push({ id: "BYE", name: "BYE", seed: players.length + 1 });

  // Simple seed pairing: 1 vs N, 2 vs N-1 ...
  const round1: any[] = [];
  for (let i = 0; i < size / 2; i++) {
    round1.push({
      tournamentId: t.id,
      round: 1,
      position: i,
      player1Id: players[i].id === "BYE" ? null : players[i].id,
      player1Name: players[i].name,
      player2Id: players[size - 1 - i].id === "BYE" ? null : players[size - 1 - i].id,
      player2Name: players[size - 1 - i].name,
      winnerId: players[size - 1 - i].id === "BYE" ? players[i].id : null,
    });
  }
  // Empty future-round placeholders
  const allMatches: any[] = [...round1];
  const totalRounds = Math.log2(size);
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = size / Math.pow(2, r);
    for (let i = 0; i < matchesInRound; i++) {
      allMatches.push({ tournamentId: t.id, round: r, position: i });
    }
  }
  await prisma.euryxTournamentMatch.createMany({ data: allMatches });
  await prisma.euryxTournament.update({ where: { id: t.id }, data: { status: "live" } });
  return NextResponse.json({ ok: true, rounds: Math.log2(size), totalMatches: allMatches.length });
}

function roundsOf(matches: any[]) {
  return matches.reduce((acc, m) => Math.max(acc, m.round), 0);
}
