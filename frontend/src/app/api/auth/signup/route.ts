import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const username = (body.username || "").trim();
    const password = body.password || "";

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Email, username and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.euryxUser.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.euryxUser.create({
      data: { email, username, passwordHash },
      select: { id: true, email: true, username: true, createdAt: true },
    });

    const token = await signToken({ sub: user.id, email: user.email, username: user.username });
    setAuthCookie(token);

    return NextResponse.json({ user, token });
  } catch (e: any) {
    console.error("[signup]", e);
    return NextResponse.json({ error: e?.message || "signup_failed" }, { status: 500 });
  }
}
