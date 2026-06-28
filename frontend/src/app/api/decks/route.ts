import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, getHatakeUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const cookie = getSessionFromRequest(req);
  const user = await getHatakeUserFromCookie(cookie);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const decks = await prisma.euryxDeck.findMany({
    where: { userId: user.id },
    include: { cards: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ decks });
}

export async function POST(req: NextRequest) {
  const cookie = getSessionFromRequest(req);
  const user = await getHatakeUserFromCookie(cookie);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { name, cards } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const deck = await prisma.euryxDeck.create({
    data: {
      name,
      userId: user.id,
      cards: {
        create: (cards || []).map((c: any) => ({
          apiId: String(c.apiId || c.id),
          name: c.name,
          imageUrl: c.imageUrl || null,
          setCode: c.setCode || null,
          variant: c.variant || "EN",
          quantity: c.quantity || 1,
        })),
      },
    },
    include: { cards: true },
  });
  return NextResponse.json({ deck });
}
