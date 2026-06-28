import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, getHatakeUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET a single deck by id (owner-only).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getHatakeUserFromCookie(getSessionFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const deck = await prisma.euryxDeck.findFirst({
    where: { id: params.id, userId: user.id },
    include: { cards: true },
  });
  if (!deck) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ deck });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getHatakeUserFromCookie(getSessionFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.euryxDeck.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
