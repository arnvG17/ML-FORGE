import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId, getCurrentUser } from "@/lib/auth-server";
import { listUserSessions, createSession } from "@/lib/session-db";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await listUserSessions(userId);
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const user = await getCurrentUser();
  
  const result = await createSession({ 
    ...body, 
    userId, 
    creatorName: user?.name, 
    creatorImage: user?.image 
  });
  return NextResponse.json(result);
}
