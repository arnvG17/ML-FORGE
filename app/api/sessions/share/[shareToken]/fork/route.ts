import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { forkSession } from "@/lib/session-db";

interface RouteParams {
  params: { shareToken: string };
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const newSessionId = await forkSession(params.shareToken, userId);
    return NextResponse.json({ sessionId: newSessionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
