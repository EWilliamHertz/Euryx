import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ user: null }, { status: 200 });
  const user = await prisma.euryxUser.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, username: true, createdAt: true },
  });
  return NextResponse.json({ user });
}
