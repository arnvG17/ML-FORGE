import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId, getCurrentUser } from "@/lib/auth-server";
import { toggleLike, addComment, getComments, loadSessionById, getCollection } from "@/lib/session-db";

interface RouteParams {
  params: { sessionId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  const comments = await getComments(params.sessionId);
  
  let userLiked = false;
  if (userId) {
    const col = await getCollection("sessions");
    const session = await col.findOne({ sessionId: params.sessionId });
    if (session && session.likes) {
      userLiked = session.likes.includes(userId);
    }
  }

  return NextResponse.json({ comments, userLiked });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, text } = body;

  try {
    if (action === "like") {
      const result = await toggleLike(params.sessionId, user.id);
      return NextResponse.json(result);
    }

    if (action === "comment") {
      if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });
      const comment = await addComment(
        params.sessionId,
        user.id,
        user.name || "Anonymous",
        user.image || "",
        text
      );
      return NextResponse.json(comment);
    }

    if (action === "rate") {
      const { rating } = body;
      if (!rating) return NextResponse.json({ error: "Rating required" }, { status: 400 });
      
      const col = await getCollection("sessions");
      const session = await col.findOne({ sessionId: params.sessionId });
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
      if (!session.shareToken) return NextResponse.json({ error: "Session not shared" }, { status: 400 });

      const { rateSession } = await import("@/lib/session-db");
      const result = await rateSession(session.shareToken, rating);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
