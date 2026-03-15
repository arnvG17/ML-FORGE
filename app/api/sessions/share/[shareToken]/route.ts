import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { loadSessionByShareToken, forkSession, rateSession } from "@/lib/session-db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { shareToken: string };
}

// GET /api/sessions/share/:shareToken — load a shared session (strips private fields)
export async function GET(req: NextRequest, { params }: RouteParams) {
  const isEmbed = req.nextUrl.searchParams.get("embed") === "true";
  const session = await loadSessionByShareToken(params.shareToken, !isEmbed);
  if (!session)
    return NextResponse.json({ error: "Not found or private" }, { status: 404 });

  // Strip internal/owner fields
  const { userId: _u, ...publicData } = session as any;
  return NextResponse.json(publicData);
}
