import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { setVisibility } from "@/lib/session-db";

interface RouteParams {
  params: { sessionId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { visibility } = await req.json();
  if (!["private", "link", "public"].includes(visibility)) {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }

  try {
    const { shareToken } = await setVisibility(params.sessionId, userId, visibility);
    const shareUrl =
      visibility === "private"
        ? null
        : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/p/${shareToken}`;
    return NextResponse.json({ visibility, shareToken, shareUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
