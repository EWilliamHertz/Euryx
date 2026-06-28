import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, getHatakeUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { elo } from "@/lib/elo";

// Records a finished match. Body:
// { roomId, opponentId?, opponentName, result: 'win'|'loss', reason, turnCount, durationSec, damageDealt, knockouts }
export async function POST(req: NextRequest) {
  const user = await getHatakeUserFromCookie(getSessionFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();

  if (!["win", "loss"].includes(b.result)) {
    return NextResponse.json({ error: "invalid result" }, { status: 400 });
  }

  // Load my stats + opponent stats (if id given). Otherwise treat opp as a 1000-elo phantom.
  const myStats = (await prisma.euryxUserStats.findUnique({ where: { userId: user.id } })) ||
    (await prisma.euryxUserStats.create({ data: { userId: user.id } }));
  let oppStats: { userId: string; elo: number } | null = null;
  if (b.opponentId) {
    oppStats = (await prisma.euryxUserStats.findUnique({ where: { userId: b.opponentId } })) ||
      (await prisma.euryxUserStats.create({ data: { userId: b.opponentId } }));
  }
  const oppElo = oppStats?.elo ?? 1000;

  // ELO calc — perspective of the caller.
  const myWon = b.result === "win";
  const { newA: myNewElo, newB: oppNewElo, deltaA: myDelta, deltaB: oppDelta } =
    elo(myStats.elo, oppElo, myWon);

  // Persist my match row
  await prisma.euryxMatchHistory.create({
    data: {
      userId: user.id,
      opponentId: b.opponentId || null,
      opponentName: b.opponentName || "Unknown",
      result: b.result,
      reason: b.reason || null,
      turnCount: b.turnCount || 0,
      durationSec: b.durationSec || 0,
      damageDealt: b.damageDealt || 0,
      knockouts: b.knockouts || 0,
      eloBefore: myStats.elo,
      eloAfter: myNewElo,
      eloDelta: myDelta,
      roomId: b.roomId || "",
    },
  });

  // Update my stats
  const newStreak = myWon ? myStats.streak + 1 : 0;
  await prisma.euryxUserStats.update({
    where: { userId: user.id },
    data: {
      wins: { increment: myWon ? 1 : 0 },
      losses: { increment: myWon ? 0 : 1 },
      elo: myNewElo,
      peakElo: Math.max(myStats.peakElo, myNewElo),
      streak: newStreak,
      bestStreak: Math.max(myStats.bestStreak, newStreak),
      totalDmg: { increment: b.damageDealt || 0 },
      totalKOs: { increment: b.knockouts || 0 },
    },
  });

  // Persist opponent's match row + stats (if known user)
  if (oppStats && b.opponentId) {
    await prisma.euryxMatchHistory.create({
      data: {
        userId: b.opponentId,
        opponentId: user.id,
        opponentName: user.username,
        result: myWon ? "loss" : "win",
        reason: b.reason || null,
        turnCount: b.turnCount || 0,
        durationSec: b.durationSec || 0,
        damageDealt: 0,
        knockouts: 0,
        eloBefore: oppElo,
        eloAfter: oppNewElo,
        eloDelta: oppDelta,
        roomId: b.roomId || "",
      },
    });
    const oppWon = !myWon;
    const oppNewStreak = oppWon ? (oppStats as any).streak + 1 : 0;
    await prisma.euryxUserStats.update({
      where: { userId: b.opponentId },
      data: {
        wins: { increment: oppWon ? 1 : 0 },
        losses: { increment: oppWon ? 0 : 1 },
        elo: oppNewElo,
        peakElo: { set: Math.max((oppStats as any).peakElo || 1000, oppNewElo) },
        streak: oppNewStreak,
        bestStreak: { set: Math.max((oppStats as any).bestStreak || 0, oppNewStreak) },
      },
    });
  }

  return NextResponse.json({
    ok: true,
    myDelta,
    myNewElo,
    oppDelta,
    oppNewElo,
  });
}
