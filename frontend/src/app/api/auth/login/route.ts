import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const user = await prisma.euryxUser.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = await signToken({ sub: user.id, email: user.email, username: user.username });
    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt },
      token,
    });
  } catch (e: any) {
    console.error("[login]", e);
    return NextResponse.json({ error: e?.message || "login_failed" }, { status: 500 });
  }
}
