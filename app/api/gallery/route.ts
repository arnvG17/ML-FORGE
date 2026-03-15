import { NextRequest, NextResponse } from "next/server";
import { getPublicGallery, searchPublicSessions } from "@/lib/session-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const sessions = q
    ? await searchPublicSessions(q)
    : await getPublicGallery();
  return NextResponse.json(sessions);
}
