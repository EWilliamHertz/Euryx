import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, getHatakeUserFromCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookie = getSessionFromRequest(req);
  const user = await getHatakeUserFromCookie(cookie);
  return NextResponse.json({ user });
}
