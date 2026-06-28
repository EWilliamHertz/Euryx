import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, getHatakeUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getHatakeUserFromCookie(getSessionFromRequest(req));
  if (!user) return NextResponse.json({ matches: [], stats: null, anonymous: true });
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
  const [matches, stats] = await Promise.all([
    prisma.euryxMatchHistory.findMany({
      where: { userId: user.id },
      orderBy: { endedAt: "desc" },
      take: Math.min(limit, 50),
    }),
    prisma.euryxUserStats.findUnique({ where: { userId: user.id } }),
  ]);
  const games = (stats?.wins || 0) + (stats?.losses || 0);
  return NextResponse.json({
    matches,
    stats: stats
      ? {
          ...stats,
          winRate: games > 0 ? Math.round(((stats.wins || 0) / games) * 100) : 0,
          games,
        }
      : { wins: 0, losses: 0, elo: 1000, peakElo: 1000, streak: 0, bestStreak: 0, totalDmg: 0, totalKOs: 0, winRate: 0, games: 0 },
  });
}
