import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, getHatakeUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET full tournament details + bracket
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const t = await prisma.euryxTournament.findUnique({
    where: { id: params.id },
    include: { registrations: true, matches: { orderBy: [{ round: "asc" }, { position: "asc" }] } },
  });
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ tournament: t });
}

// POST register the current user
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getHatakeUserFromCookie(getSessionFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t = await prisma.euryxTournament.findUnique({ where: { id: params.id } });
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (t.status !== "registration") return NextResponse.json({ error: "Registration closed" }, { status: 400 });
  if (t.registeredCnt >= t.capacity) return NextResponse.json({ error: "Tournament full" }, { status: 400 });

  try {
    await prisma.euryxTournamentRegistration.create({
      data: { tournamentId: t.id, userId: user.id, username: user.username },
    });
    await prisma.euryxTournament.update({
      where: { id: t.id },
      data: { registeredCnt: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Already registered" }, { status: 409 });
    return NextResponse.json({ error: e?.message || "register_failed" }, { status: 500 });
  }
}

// DELETE = unregister
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getHatakeUserFromCookie(getSessionFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const reg = await prisma.euryxTournamentRegistration.findUnique({
    where: { tournamentId_userId: { tournamentId: params.id, userId: user.id } },
  });
  if (!reg) return NextResponse.json({ ok: true });
  await prisma.euryxTournamentRegistration.delete({ where: { id: reg.id } });
  await prisma.euryxTournament.update({
    where: { id: params.id },
    data: { registeredCnt: { decrement: 1 } },
  });
  return NextResponse.json({ ok: true });
}
