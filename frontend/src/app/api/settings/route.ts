import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, getHatakeUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
  showChatInGame: false,
  preferredSeat: "auto",
  reduceMotion: false,
};

export async function GET(req: NextRequest) {
  const user = await getHatakeUserFromCookie(getSessionFromRequest(req));
  if (!user) return NextResponse.json({ settings: DEFAULT_SETTINGS, anonymous: true });
  const s = await prisma.euryxUserSettings.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    settings: s
      ? {
          showChatInGame: s.showChatInGame,
          preferredSeat: s.preferredSeat,
          reduceMotion: s.reduceMotion,
        }
      : DEFAULT_SETTINGS,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getHatakeUserFromCookie(getSessionFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: Record<string, any> = {};
  if (typeof body.showChatInGame === "boolean") data.showChatInGame = body.showChatInGame;
  if (typeof body.preferredSeat === "string" && ["auto", "player1", "player2"].includes(body.preferredSeat))
    data.preferredSeat = body.preferredSeat;
  if (typeof body.reduceMotion === "boolean") data.reduceMotion = body.reduceMotion;

  const s = await prisma.euryxUserSettings.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
  return NextResponse.json({
    settings: {
      showChatInGame: s.showChatInGame,
      preferredSeat: s.preferredSeat,
      reduceMotion: s.reduceMotion,
    },
  });
}
