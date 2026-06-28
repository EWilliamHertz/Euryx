import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const decks = await prisma.euryxDeck.findMany({
    where: { userId: session.sub },
    include: { cards: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ decks });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { name, cards } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const deck = await prisma.euryxDeck.create({
    data: {
      name,
      userId: session.sub,
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
